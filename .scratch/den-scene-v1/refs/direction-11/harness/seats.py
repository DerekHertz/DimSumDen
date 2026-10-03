"""seats.py <surf.json> <name> <s>  -> seat solution in Bao-local model coords (group space, feet at y=-1)."""
import json,sys,numpy as np
d=json.load(open(sys.argv[1]))[sys.argv[2]]; s=float(sys.argv[3])
P=np.array(d['pts']).reshape(-1,3); B=np.array(d['bones'])
FOOT=0.22                       # panda half footprint at its seat, world units (0.3 scale plush)
PH=FOOT/s                       # in Bao model units
PANDA_H=0.45/s                  # panda body height above its feet, model units
head=np.isin(B,['head','ear_L','ear_R']); arm=np.isin(B,['arm_L','arm_R'])
bw=lambda m:(P[m][:,0].max()-P[m][:,0].min())
print(sys.argv[2],'bbox y',P[:,1].min().round(3),P[:,1].max().round(3),'| head w',bw(head).round(3),'body w',bw(B=='body').round(3),'ratio',(bw(head)/bw(B=='body')).round(2),'| total h',(P[:,1].max()-P[:,1].min()).round(3))
H=P[head&(abs(P[:,0])<0.08)]; k=np.argmax(H[:,1]); crown=H[k]
E=P[np.isin(B,['ear_L','ear_R'])]
def topdrop(Q,xc,zc):
    col=Q[(abs(Q[:,0]-xc)<0.03)&(abs(Q[:,2]-zc)<PH)]
    return col[:,1].max() if len(col) else -9
cz=crown[2]
cd=crown[1]-min(topdrop(P[head],0-PH,cz),topdrop(P[head],0+PH,cz))
res={'crown':[0,float(crown[1]),float(crown[2])],'crownDroopWorld':float(cd*s),'earTop':float(E[:,1].max()),'earInner':float(abs(E[:,0]).min()),'seats':{}}
print(' crown y %.3f z %.3f droop(world) %.3f | ear top %.3f ear inner x %.3f'%(crown[1],crown[2],cd*s,E[:,1].max(),abs(E[:,0]).min()))
for name,sx in (('product',-1),('architect',1)):
    A=P[arm&(np.sign(P[:,0])==sx)]
    pick=None
    for x in np.arange(0.62,1.12,0.01):
        xc=sx*x
        cols=A[abs(A[:,0]-xc)<0.03]
        if not len(cols): continue
        top=cols[:,1].max(); zc=cols[np.argmax(cols[:,1])][2]
        box=P[head&(abs(P[:,0]-xc)<PH)&(P[:,1]>top+0.03)&(P[:,1]<top+PANDA_H)&(abs(P[:,2]-zc)<PH)]
        if len(box)<=3:
            drop=top-min(topdrop(A,xc-PH,zc),topdrop(A,xc+PH,zc))
            pick=(x,top,zc,drop*s,len(box));break
    print(' ',name,'x %.2f top y %.3f z %.3f droop(world) %.3f head-intrusion verts %d'%pick if pick else (' ',name,'NO CLEAR SEAT'))
    if pick: res['seats'][name]=[sx*pick[0],float(pick[1]),float(pick[2])]; res['droop_'+name]=float(pick[3])
print('JSON',json.dumps(res))
