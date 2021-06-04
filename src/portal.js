import './lib/aframe-aabb-collider-component.min';

AFRAME.registerComponent('portal', {
  schema: {
    destSelector: { default: '' }, //rename
    width: { default: 2 },
    height: { default: 3 },
    maxRecursion: { default: 2 },
  },

  init: function () {
    const el = this.el;
    const sceneEl = el.sceneEl;
    const data = this.data;

    el.setAttribute('visible', false); //tell aframe not to render this

    //portal mesh
    const geometry = new THREE.BoxBufferGeometry(data.width, data.height, 0.01);
    const material = new THREE.MeshBasicMaterial({
      colorWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.geometry.computeBoundingSphere();
    mesh.frustumCulled = true;
    mesh.matrixAutoUpdate = false;
    mesh.renderOrder = 2;
    mesh.visible = true;

    el.object3D.add(mesh);

    sceneEl.addEventListener('loaded', () => {
      const cameraEl = sceneEl.camera.el;
      if (cameraEl.id) {
        el.setAttribute('aabb-collider', { objects: `#${cameraEl.id}` });
      } else {
        cameraEl.id = 'web-portal-cam-tag';
        el.setAttribute('aabb-collider', { objects: `#${cameraEl.id}` });
      }
    });

    el.addEventListener('hitstart', function () {
      //teleport the camera
      //const destPortal = document.querySelector(data.destSelector);
    });

    if (!sceneEl.portals) {
      //use sceneEl to store state
      sceneEl.portals = [];
      sceneEl.portalPairs = [];

      //add portal rendering to the render loop
      sceneEl.object3D.onAfterRender = (renderer, scene, camera) => {
        this.renderRecursivePortals(renderer, camera);
      };
    }

    const portals = sceneEl.portals;
    const pairs = sceneEl.portalPairs;

    portals.push(el.object3D);

    const dest = document.querySelector(data.destSelector);
    if (dest) {
      let isInPairs = false;
      pairs.forEach((pair) => {
        pair.forEach((portal) => {
          if (portal == el.object3D) {
            isInPairs = true;
          }
        });
      });

      if (isInPairs == false) {
        pairs.push([el.object3D, dest.object3D]);
      }
    }
  },

  tick: function () {},

  /*
  renderSinglePortal: function () {
    const sceneEl = this.el.sceneEl;
    const scene = sceneEl.object3D;
    const renderer = sceneEl.renderer;
    const camera = sceneEl.camera;

    renderer.autoClear = false;
    camera.matrixAutoUpdate = false;

    const gl = renderer.getContext();

    const portal = this.el.object3D;
    const destPortal = document.querySelector(this.data.destSelector).object3D;

    const tmpScene = new THREE.Scene();
    tmpScene.children = scene.children;

    const portalScene = new THREE.Scene();
    portalScene.children = portal.children;

    const virtualCam = new THREE.PerspectiveCamera().copy(camera);
    virtualCam.matrixWorld = computeViewMatrix(camera, portal, destPortal);
    //projection matrix for Oblique View Frustum Depth Projection and Clipping
    virtualCam.projectionMatrix = computeProjectionMatrix(
      destPortal,
      virtualCam.matrixWorld,
      virtualCam.projectionMatrix
    );

    gl.enable(gl.STENCIL_TEST);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
    gl.stencilMask(0xff);

    renderer.render(portalScene, camera);

    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    gl.stencilMask(0x00);

    renderer.clearDepth();
    renderer.render(tmpScene, virtualCam);

    gl.stencilMask(0xff);
    gl.disable(gl.STENCIL_TEST);

    camera.matrixAutoUpdate = true;
  },
  */

  renderRecursivePortals: function (renderer, camera, recursionLevel = 0) {
    const sceneEl = this.el.sceneEl;
    const portals = sceneEl.portals;
    const pairs = sceneEl.portalPairs;

    const gl = renderer.getContext();

    renderer.autoClear = false;
    camera.matrixAutoUpdate = false;

    pairs.forEach((pair) => {
      pair.forEach((portal, i) => {
        const destPortal = pair[1 - i];

        const portalScene = new THREE.Scene();
        portalScene.children = portal.children;

        gl.colorMask(false, false, false, false);
        gl.depthMask(false);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc(gl.NOTEQUAL, recursionLevel, 0xff);
        gl.stencilOp(gl.INCR, gl.KEEP, gl.KEEP);
        gl.stencilMask(0xff);

        //render portal into stencil buffer
        renderer.render(portalScene, camera);

        const virtualCam = new THREE.PerspectiveCamera().copy(camera);
        virtualCam.matrixWorld = computeViewMatrix(camera, portal, destPortal);
        //projection matrix for Oblique View Frustum Depth Projection and Clipping
        virtualCam.projectionMatrix = computeProjectionMatrix(
          destPortal,
          virtualCam.matrixWorld,
          virtualCam.projectionMatrix
        );

        if (recursionLevel == this.data.maxRecursion) {
          gl.colorMask(true, true, true, true);
          gl.depthMask(true);
          renderer.clear(false, true, false);
          gl.enable(gl.DEPTH_TEST);
          gl.enable(gl.STENCIL_TEST);
          gl.stencilMask(0x00);
          gl.stencilFunc(gl.EQUAL, recursionLevel + 1, 0xff);

          const nonPortals = new THREE.Scene();
          nonPortals.children = sceneEl.object3D.children.filter((obj) => !portals.includes(obj));

          const tmpScene = new THREE.Scene();
          tmpScene.children = sceneEl.object3D.children;

          //render the rest of the scene, limited to the stencil buffer
          renderer.render(tmpScene, virtualCam);
        } else {
          //recursion
          this.renderRecursivePortals(renderer, virtualCam, recursionLevel + 1);
        }

        gl.colorMask(false, false, false, false);
        gl.depthMask(false);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilMask(0xff);
        gl.stencilFunc(gl.NOTEQUAL, recursionLevel + 1, 0xff);
        gl.stencilOp(gl.DECR, gl.KEEP, gl.KEEP);

        //render portal into stencil buffer
        renderer.render(portalScene, camera);
      });
    });

    gl.disable(gl.STENCIL_TEST);
    gl.stencilMask(0x00);
    gl.colorMask(false, false, false, false);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.ALWAYS);
    renderer.clear(false, true, false);

    //render portals into depth buffer
    portals.forEach((portal) => {
      const portalScene = new THREE.Scene();
      portalScene.children = portal.children;
      renderer.render(portalScene, camera);
    });

    gl.depthFunc(gl.LESS);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilMask(0x00);
    gl.stencilFunc(gl.LEQUAL, recursionLevel, 0xff);
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);

    const nonPortals = new THREE.Scene();
    //nonPortals.children = sceneEl.object3D.children.filter((obj) => !portals.includes(obj));
    nonPortals.children = sceneEl.object3D.children;

    const tmpScene = new THREE.Scene();
    tmpScene.children = sceneEl.object3D.children;

    //render the rest of the scene, only at recursionLevel
    renderer.render(tmpScene, camera);

    camera.matrixAutoUpdate = true;
  },
});

function computeViewMatrix(camera, src, dst) {
  const srcToCam = camera.matrixWorld.clone();
  srcToCam.invert().multiply(src.matrixWorld);

  const dstInverse = dst.matrixWorld.clone().invert();
  const rotationYMatrix = new THREE.Matrix4().makeRotationY(Math.PI);
  const srcToDst = new THREE.Matrix4().multiply(srcToCam).multiply(rotationYMatrix).multiply(dstInverse);

  return srcToDst.invert();
}

function computeProjectionMatrix(dst, viewMat, projMat) {
  const cameraInverseViewMat = viewMat.clone().invert();

  const dstRotationMatrix = new THREE.Matrix4().extractRotation(dst.matrixWorld);

  const normal = new THREE.Vector3().set(0, 0, 1).applyMatrix4(dstRotationMatrix);

  const clipPlane = new THREE.Plane();
  clipPlane.setFromNormalAndCoplanarPoint(normal, dst.getWorldPosition(new THREE.Vector3()));
  clipPlane.applyMatrix4(cameraInverseViewMat);

  const clipVector = new THREE.Vector4();
  clipVector.set(clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.constant);

  const projectionMatrix = projMat.clone();

  const q = new THREE.Vector4();
  q.x = (Math.sign(clipVector.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
  q.y = (Math.sign(clipVector.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
  q.z = -1.0;
  q.w = (1.0 + projectionMatrix.elements[10]) / projMat.elements[14];

  clipVector.multiplyScalar(2 / clipVector.dot(q));

  projectionMatrix.elements[2] = clipVector.x;
  projectionMatrix.elements[6] = clipVector.y;
  projectionMatrix.elements[10] = clipVector.z + 1.0;
  projectionMatrix.elements[14] = clipVector.w;

  return projectionMatrix;
}
