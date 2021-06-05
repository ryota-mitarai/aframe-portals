AFRAME.registerComponent('portal-manager', {
  schema: {
    maxRecursion: { default: 2 },
  },

  init: function () {},

  tick: function () {
    const sceneEl = this.el.sceneEl;
    const portals = sceneEl.portals;
    const camera = sceneEl.camera;

    //portal collision detection
    const collisions = portals.map((portal) => {
      const mesh = portal.children.filter((c) => c.name == 'portal-surface')[0];
      const bbox = new THREE.Box3().setFromObject(mesh);
      const bounds = {
        portal: portal,
        xMin: bbox.min.x,
        xMax: bbox.max.x,
        yMin: bbox.min.y,
        yMax: bbox.max.y,
        zMin: bbox.min.z,
        zMax: bbox.max.z,
      };
      return bounds;
    });

    const width = 0.1; //width of user hitbox, arbitrary number

    //calculate user bounds
    const camPos = camera.getWorldPosition(new THREE.Vector3());
    const bounds = {
      xMin: camPos.x - width / 2,
      xMax: camPos.x + width / 2,
      yMin: camPos.y - width / 2,
      yMax: camPos.y + width / 2,
      zMin: camPos.z - width / 2,
      zMax: camPos.z + width / 2,
    };

    collisions.forEach((obj) => {
      if (
        bounds.xMin <= obj.xMax &&
        bounds.xMax >= obj.xMin &&
        bounds.yMin <= obj.yMax &&
        bounds.yMax >= obj.yMin &&
        bounds.zMin <= obj.zMax &&
        bounds.zMax >= obj.zMin
      ) {
        //there is a collision
        console.log('collision!');
        const portalEl = obj.portal.el;
        portalEl.emit('camera-collision');
      }
    });
  },

  tock: function () {
    const camera = this.el.sceneEl.camera;
    const renderer = this.el.sceneEl.renderer;

    this.renderRecursivePortals(renderer, camera, 0);
  },

  renderRecursivePortals: function (renderer, camera, recursionLevel) {
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
