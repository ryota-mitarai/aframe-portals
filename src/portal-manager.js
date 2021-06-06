import { computeViewMatrix, computeProjectionMatrix } from './utils';

AFRAME.registerComponent('portal-manager', {
  schema: {
    skipTicks: { default: 25 },
    maxRecursion: { default: 0 },
  },

  init: function () {
    const data = this.data;
    const sceneEl = this.el.sceneEl;

    data.ticks = 0;
    data.maxRecursion = sceneEl.portals.reduce((acc, obj) => Math.max(acc, obj.maxRecursion), data.maxRecursion);
  },

  tick: function () {
    const data = this.data;
    const sceneEl = this.el.sceneEl;
    const portals = sceneEl.portals;

    if (data.ticks % data.skipTicks === 0) {
      //sort portals by distance to camera
      //render the farthest portals first
      const cameraPosition = sceneEl.camera.getWorldPosition(new THREE.Vector3());
      portals.forEach((obj) => {
        obj.distance = obj.portal.getWorldPosition(new THREE.Vector3()).distanceTo(cameraPosition);
      });
      portals.sort((a, b) => b.distance - a.distance);
    }

    data.ticks++;
  },

  tock: function () {
    const sceneEl = this.el.sceneEl;
    const camera = sceneEl.camera;
    const renderer = sceneEl.renderer;

    this.renderRecursivePortals(renderer, camera, 0);
    this.collisionDetection();
  },

  renderRecursivePortals: function (renderer, camera, recursionLevel) {
    const sceneEl = this.el.sceneEl;
    const portals = sceneEl.portals;

    const gl = renderer.getContext();
    const tmpScene = sceneEl.object3D.clone();

    renderer.autoClear = false;
    camera.matrixAutoUpdate = false;

    portals.forEach((obj) => {
      const portal = obj.portal;
      const destPortal = obj.destination;

      gl.colorMask(false, false, false, false);
      gl.depthMask(false);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.NOTEQUAL, recursionLevel, 0xff);
      gl.stencilOp(gl.INCR, gl.KEEP, gl.KEEP);
      gl.stencilMask(0xff);

      //render portal into stencil buffer
      renderer.render(portal, camera);

      const virtualCam = camera.clone();
      virtualCam.matrixWorld = computeViewMatrix(camera, portal, destPortal);
      //projection matrix for frustrum clipping
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
      renderer.render(portal, camera);
    });

    gl.disable(gl.STENCIL_TEST);
    gl.stencilMask(0x00);
    gl.colorMask(false, false, false, false);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.ALWAYS);
    renderer.clear(false, true, false);

    //render portals into depth buffer
    portals.forEach((obj) => {
      renderer.render(obj.portal, camera);
    });

    gl.depthFunc(gl.LESS);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilMask(0x00);
    gl.stencilFunc(gl.LEQUAL, recursionLevel, 0xff);
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);

    //render the rest of the scene, but only at recursionLevel
    renderer.render(tmpScene, camera);

    camera.matrixAutoUpdate = true;
  },

  collisionDetection: function () {
    const sceneEl = this.el.sceneEl;
    const portals = sceneEl.portals;
    const camera = sceneEl.camera;

    //portal collision detection
    const collisions = portals.map((obj) => {
      const portal = obj.portal;
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
        const portalEl = obj.portal.el;
        if (portalEl.isCameraColliding === false) {
          portalEl.emit('camera-collision-start');
          portalEl.isCameraColliding = true;
        }
      } else {
        const portalEl = obj.portal.el;
        if (portalEl.isCameraColliding === true) {
          portalEl.emit('camera-collision-end');
          portalEl.isCameraColliding = false;
        }
      }
    });
  },
});
