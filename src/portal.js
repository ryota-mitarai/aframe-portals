AFRAME.registerComponent('portal', {
  schema: {
    destSelector: { default: '' }, //rename
    width: { default: 2 },
    height: { default: 3 },
    maxRecursion: { default: 2 },
    teleportCooldown: { default: 100 }, //in ms
    enableTeleport: { default: true },
  },

  init: function () {
    const el = this.el;
    const sceneEl = el.sceneEl;
    const data = this.data;

    el.justTeleported = false;
    el.isCameraColliding = false;

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
    mesh.name = 'portal-surface';

    el.object3D.add(mesh);

    sceneEl.addEventListener('portal-teleported', () => {
      el.justTeleported = true;
    });

    el.addEventListener('camera-collision-start', function () {
      if (data.enableTeleport == false) return;
      if (el.justTeleported === true) return;
      el.justTeleported = true;
      sceneEl.emit('portal-teleported');

      //teleport the camera
      const camera = sceneEl.camera;
      const cameraEl = camera.el;

      const destPortal = document.querySelector(data.destSelector).object3D;

      const srcRotation = el.object3D.rotation;
      const dstRotation = destPortal.rotation;

      const deltaRotation = new THREE.Euler(
        srcRotation.x - dstRotation.x,
        srcRotation.y - dstRotation.y,
        srcRotation.z - dstRotation.z
      );

      if (cameraEl.components['look-controls']) {
        cameraEl.components['look-controls'].yawObject.rotation.y += deltaRotation.y;
      }

      const bufferDistance = 0.075; //teleports the player this distance away from the exit portal
      const buffer = el.object3D.getWorldDirection(new THREE.Vector3()).multiplyScalar(bufferDistance);

      const deltaPosition = new THREE.Vector3().subVectors(
        camera.getWorldPosition(new THREE.Vector3()),
        el.object3D.getWorldPosition(new THREE.Vector3())
      );
      deltaPosition.sub(buffer);

      const rotatedDelta = new THREE.Vector3();
      const theta = deltaRotation.y;
      rotatedDelta.x = deltaPosition.x * Math.cos(theta) - deltaPosition.z * Math.sin(theta);
      rotatedDelta.z = deltaPosition.x * Math.sin(theta) + deltaPosition.z * Math.cos(theta);

      const destPosition = destPortal.position.clone().sub(rotatedDelta);

      cameraEl.object3D.position.x = destPosition.x;
      cameraEl.object3D.position.y = destPosition.y;
      cameraEl.object3D.position.z = destPosition.z;
    });

    //use sceneEl to store state
    if (!sceneEl.portals) {
      sceneEl.portals = [];
      sceneEl.portalPairs = [];
    }

    //if there is not already a portal-manager entity, create one
    if (Array.from(sceneEl.children).reduce((acc, c) => acc || c.hasAttribute('portal-manager'), false) === false) {
      const entity = document.createElement('a-entity');
      entity.setAttribute('portal-manager', { maxRecursion: data.maxRecursion });
      sceneEl.appendChild(entity);
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

  tick: function () {
    const el = this.el;
    if (el.justTeleported === true)
      setTimeout(() => {
        el.justTeleported = false;
      }, this.data.teleportCooldown);
  },

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
});
