/* ===================== RETARGET (trial) =====================
   Carry the Toon Shooter clips onto a different skeleton (the Quaternius
   Universal Base Characters rig) by baking world-space rotation deltas:
   for each mapped bone, the change in world rotation the source clip
   applies to its rest pose is applied to the target bone's rest pose,
   after a one-off rest alignment that turns each target bone to point
   the way its source counterpart points (so a T-pose target follows an
   A-pose source without its arms riding high). The hips also carry the
   source's root motion, scaled by the height ratio. Fingers and the
   spine chain are mapped where the rigs line up; unmapped bones keep
   their rest pose. */
const RT_MAP={pelvis:'Hips',spine_01:'Abdomen',spine_02:'Torso',neck_01:'Neck',Head:'Head',
  clavicle_l:'ShoulderL',upperarm_l:'UpperArmL',lowerarm_l:'LowerArmL',clavicle_r:'ShoulderR',upperarm_r:'UpperArmR',lowerarm_r:'LowerArmR',
  thigh_l:'UpperLegL',calf_l:'LowerLegL',foot_l:'FootL',thigh_r:'UpperLegR',calf_r:'LowerLegR',foot_r:'FootR',
  index_01_l:'Index1L',index_02_l:'Index2L',index_03_l:'Index3L',middle_01_l:'Middle1L',middle_02_l:'Middle2L',middle_03_l:'Middle3L',pinky_01_l:'Pinky1L',pinky_02_l:'Pinky2L',pinky_03_l:'Pinky3L',thumb_01_l:'Thumb1L',thumb_02_l:'Thumb2L',
  index_01_r:'Index1R',index_02_r:'Index2R',index_03_r:'Index3R',middle_01_r:'Middle1R',middle_02_r:'Middle2R',middle_03_r:'Middle3R',pinky_01_r:'Pinky1R',pinky_02_r:'Pinky2R',pinky_03_r:'Pinky3R',thumb_01_r:'Thumb1R',thumb_02_r:'Thumb2R'};
// The bone each one "points at" for rest alignment (its child along the limb).
const RT_CHILD={pelvis:'spine_01',spine_01:'spine_02',spine_02:'neck_01',neck_01:'Head',clavicle_l:'upperarm_l',upperarm_l:'lowerarm_l',lowerarm_l:'hand_l',clavicle_r:'upperarm_r',upperarm_r:'lowerarm_r',lowerarm_r:'hand_r',thigh_l:'calf_l',calf_l:'foot_l',thigh_r:'calf_r',calf_r:'foot_r'};
// Bones whose geometry differs too much to align by direction (the toon rig's shoulder bone points up, the base rig's clavicle points out): carry the rotation delta only.
const RT_NOFIX=new Set(['clavicle_l','clavicle_r']);
const RT_SRC_CHILD={Hips:'Abdomen',Abdomen:'Torso',Torso:'Neck',Neck:'Head','ShoulderL':'UpperArmL','UpperArmL':'LowerArmL','LowerArmL':'Index1L','ShoulderR':'UpperArmR','UpperArmR':'LowerArmR','LowerArmR':'Index1R','UpperLegL':'LowerLegL','LowerLegL':'FootL','UpperLegR':'LowerLegR','LowerLegR':'FootR'};
function rtBones(root){const b={};root.traverse(o=>{if(o.isBone&&!b[o.name])b[o.name]=o});return b}
function rtWorldQ(bone){const q=new THREE.Quaternion();bone.updateWorldMatrix(true,false);bone.matrixWorld.decompose(new THREE.Vector3(),q,new THREE.Vector3());return q}
function rtWorldP(bone){bone.updateWorldMatrix(true,false);return new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld)}
// Bake one clip. src/tgt are skinned roots in their rest poses. Returns an AnimationClip for the target.
function retargetClip(src,tgt,clip,fps=30){const S=rtBones(src),T=rtBones(tgt);
  const mixer=new THREE.AnimationMixer(src),act=mixer.clipAction(clip);act.play();mixer.setTime(0);src.updateMatrixWorld(true);
  // Rest data (source at frame 0 of a neutral pose is close enough; use the bind pose by resetting the mixer).
  mixer.stopAllAction();src.traverse(o=>{if(o.isBone&&o.userData.rtRest){o.position.fromArray(o.userData.rtRest.p);o.quaternion.fromArray(o.userData.rtRest.q)}});
  const pairs=[],tmpQ=new THREE.Quaternion();
  for(const[tn,sn]of Object.entries(RT_MAP)){const tb=T[tn],sb=S[sn];if(!tb||!sb)continue;
    const sRest=rtWorldQ(sb),tRest=rtWorldQ(tb);let fix=new THREE.Quaternion();
    const tc=RT_CHILD[tn]&&T[RT_CHILD[tn]],sc=RT_SRC_CHILD[sn]&&S[RT_SRC_CHILD[sn]];
    if(tc&&sc&&!RT_NOFIX.has(tn)){const td=rtWorldP(tc).sub(rtWorldP(tb)).normalize(),sd=rtWorldP(sc).sub(rtWorldP(sb)).normalize();
      // Full frame alignment: bone direction plus a roll reference (world up, or world forward for near-vertical bones),
      // so the elbow and knee hinges land the same way on both rigs.
      if(td.lengthSq()>0&&sd.lengthSq()>0){const frame=d=>{const ref=Math.abs(d.y)>.8?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);const n=new THREE.Vector3().crossVectors(ref,d).normalize(),b2=new THREE.Vector3().crossVectors(d,n).normalize();return new THREE.Matrix4().makeBasis(d,n,b2)};
        const Fs=frame(sd),Ft=frame(td);fix.setFromRotationMatrix(Fs.multiply(Ft.invert()))}}
    const parentRest=tb.parent?rtWorldQ(tb.parent):new THREE.Quaternion();
    pairs.push({tb,sb,sRestInv:sRest.clone().invert(),tRest,fix,parentRest,tn})}
  const hipS=S.Hips,hipT=T.pelvis,hs=rtWorldP(hipS).y,ht=rtWorldP(hipT).y,ratio=hs>0?ht/hs:1,hipRest=hipT.position.clone(),hipSrcRest=hipS.position.clone();
  const n=Math.max(2,Math.round(clip.duration*fps)),times=new Float32Array(n),qv={},pv=new Float32Array(n*3);
  for(const p of pairs)qv[p.tn]=new Float32Array(n*4);
  const act2=mixer.clipAction(clip);act2.play();
  for(let i=0;i<n;i++){const t=i/(n-1)*clip.duration;times[i]=t;mixer.setTime(t);src.updateMatrixWorld(true);
    for(const p of pairs){const sw=rtWorldQ(p.sb);const delta=sw.multiply(p.sRestInv);// world delta the clip applies
      // target world = delta * (fix applied in world) * tRest  -> local = inv(parentWorld) * world. Parent world is the parent's animated world,
      // so we solve top-down: use parent's current world after we set it this frame.
      const parentW=p.tb.parent?rtWorldQ(p.tb.parent):new THREE.Quaternion();
      const world=delta.clone().multiply(p.fix).multiply(p.tRest);const local=parentW.clone().invert().multiply(world);
      p.tb.quaternion.copy(local);p.tb.updateWorldMatrix(false,false);qv[p.tn].set([local.x,local.y,local.z,local.w],i*4)}
    const hp=hipS.position.clone().sub(hipSrcRest).multiplyScalar(ratio).add(hipRest);pv.set([hp.x,hp.y,hp.z],i*3)}
  mixer.stopAllAction();
  const tracks=[];for(const p of pairs)tracks.push(new THREE.QuaternionKeyframeTrack(p.tb.name+'.quaternion',times,qv[p.tn]));
  tracks.push(new THREE.VectorKeyframeTrack(hipT.name+'.position',times,pv));
  // put the target back to rest
  for(const p of pairs)p.tb.quaternion.copy(p.tb.userData.rtRest?new THREE.Quaternion().fromArray(p.tb.userData.rtRest.q):p.tb.quaternion);
  return new THREE.AnimationClip(clip.name,clip.duration,tracks)}
function rtSaveRest(root){root.traverse(o=>{if(o.isBone)o.userData.rtRest={p:o.position.toArray(),q:o.quaternion.toArray()}})}
// Debug: pose the target in the source's rest (fix only, no clip) and report the arm fixes.
function rtRestPose(src,tgt){const S=rtBones(src),T=rtBones(tgt),out=[];src.updateMatrixWorld(true);tgt.updateMatrixWorld(true);
  for(const[tn,sn]of Object.entries(RT_MAP)){const tb=T[tn],sb=S[sn];if(!tb||!sb)continue;const tc=RT_CHILD[tn]&&T[RT_CHILD[tn]],sc=RT_SRC_CHILD[sn]&&S[RT_SRC_CHILD[sn]];if(!(tc&&sc))continue;
    const td=rtWorldP(tc).sub(rtWorldP(tb)).normalize(),sd=rtWorldP(sc).sub(rtWorldP(sb)).normalize();
    const frame=d=>{const ref=Math.abs(d.y)>.8?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);const n=new THREE.Vector3().crossVectors(ref,d).normalize(),b2=new THREE.Vector3().crossVectors(d,n).normalize();return new THREE.Matrix4().makeBasis(d,n,b2)};
    const fix=new THREE.Quaternion().setFromRotationMatrix(frame(sd).multiply(frame(td).invert()));const tRest=rtWorldQ(tb),parentW=tb.parent?rtWorldQ(tb.parent):new THREE.Quaternion();
    const world=fix.clone().multiply(tRest);tb.quaternion.copy(parentW.invert().multiply(world));tb.updateWorldMatrix(false,false);
    out.push(`${tn}<-${sn} td=${td.toArray().map(v=>v.toFixed(2))} sd=${sd.toArray().map(v=>v.toFixed(2))} fixAngle=${(2*Math.acos(Math.min(1,Math.abs(fix.w)))*180/Math.PI).toFixed(0)}`)}
  return out}
