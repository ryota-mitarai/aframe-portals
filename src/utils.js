export const computeViewMatrix = (camera, src, dst) => {
  const srcToCam = camera.matrixWorld.clone();
  srcToCam.invert().multiply(src.matrixWorld);

  const dstInverse = dst.matrixWorld.clone().invert();
  const rotationYMatrix = new THREE.Matrix4().makeRotationY(Math.PI);
  const srcToDst = new THREE.Matrix4().multiply(srcToCam).multiply(rotationYMatrix).multiply(dstInverse);

  return srcToDst.invert();
};

export const computeProjectionMatrix = (dst, viewMat, projMat) => {
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
};
