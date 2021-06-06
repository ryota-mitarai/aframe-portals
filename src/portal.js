AFRAME.registerComponent('portal', {
  schema: {
    destination: { default: '' },
    width: { default: 2 },
    height: { default: 3 },
    maxRecursion: { default: 0 },
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
    const geometry = new THREE.BoxBufferGeometry(data.width, data.height, 0.0001);
    const material = new THREE.MeshBasicMaterial({ colorWrite: false });
    const mesh = new THREE.Mesh(geometry, material);
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

      const destPortal = document.querySelector(data.destination).object3D;

      const srcRotation = el.object3D.rotation;
      const dstRotation = destPortal.rotation;

      const deltaRotation = new THREE.Euler(
        srcRotation.x - dstRotation.x,
        srcRotation.y - dstRotation.y + Math.PI,
        srcRotation.z - dstRotation.z
      );

      if (cameraEl.components['look-controls']) {
        cameraEl.components['look-controls'].yawObject.rotation.y -= deltaRotation.y;
      }

      const bufferDistance = 0.075; //teleports the player this distance away from the exit portal
      const buffer = el.object3D.getWorldDirection(new THREE.Vector3()).multiplyScalar(bufferDistance);

      const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
      const portalPosition = el.object3D.getWorldPosition(new THREE.Vector3());

      const deltaPosition = new THREE.Vector3().subVectors(cameraPosition, portalPosition).sub(buffer);

      const rotatedDeltaPosition = deltaPosition.clone();
      const theta = deltaRotation.y;
      rotatedDeltaPosition.x = deltaPosition.x * Math.cos(theta) - deltaPosition.z * Math.sin(theta);
      rotatedDeltaPosition.z = deltaPosition.x * Math.sin(theta) + deltaPosition.z * Math.cos(theta);

      const destPosition = destPortal.position.clone().add(rotatedDeltaPosition);

      cameraEl.object3D.position.x = destPosition.x;
      cameraEl.object3D.position.y = destPosition.y;
      cameraEl.object3D.position.z = destPosition.z;
    });

    //use sceneEl to store state
    if (!sceneEl.portals) {
      sceneEl.portals = [];
    }

    //if there is not already a portal-manager entity, create one
    if (Array.from(sceneEl.children).reduce((acc, c) => acc || c.hasAttribute('portal-manager'), false) === false) {
      const entity = document.createElement('a-entity');
      entity.setAttribute('portal-manager', { maxRecursion: data.maxRecursion });
      sceneEl.appendChild(entity);
    }

    //add this portal to the 'portals' list
    const portals = sceneEl.portals;
    const dest = document.querySelector(data.destination);

    const portalObj = {
      portal: el.object3D,
      destination: dest.object3D,
      maxRecursion: data.maxRecursion,
      distance: 0,
    };
    portals.push(portalObj);
  },

  tick: function () {
    const el = this.el;
    if (el.justTeleported === true)
      setTimeout(() => {
        el.justTeleported = false;
      }, this.data.teleportCooldown);
  },
});
