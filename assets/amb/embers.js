/* ambient: embers. A sparse field of glowing embers in world space around and behind the figure, with the bokeh's depth of field
   (near ones big and soft, far ones pin-sharp and dim). At rest they rise and flicker, the quick ones trailing a faint tail, the hottest wrapped
   in a soft glow, and now and then one crackles and spits a spark; a fast scroll streams them; the scatter throws a few off the cloud;
   the roar ignites a burst off the mane; the tomb flash heats them white and pushes them out; the portal winds them into the ring and the camera flies through.
   A device asking for less motion gets the same embers drifting at half speed, with no bursts or sparks */
(function(){ var L=window.LionAmbient=window.LionAmbient||{};
  var g,pr,U={},aP,aI,aV,bf,DB,NA,NB,N,X,V,AG,LF,SD,HT,SZ,RS,KD,PR,RA,RR,RZ,RW,DR,DZ,sm,PMAX,nb=0,ph=0,oo=0,lastT=-1,pPa=0,pSc=0,pFl=0,ppx=0,ppy=0,acc=0,wPs=0,nCk=0;
  function rnd(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  var R=rnd(7071);
  function sstep(a,b,t){ t=(t-a)/(b-a); t=t<0?0:t>1?1:t; return t*t*(3-2*t); }
  function sh(type,src){ var s=g.createShader(type); g.shaderSource(s,src); g.compileShader(s); if(!g.getShaderParameter(s,g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; }
  var vs='attribute vec4 aP;attribute vec4 aI;attribute float aV;uniform mat4 uPV;uniform vec3 uEye;uniform vec4 uFg;'+
    'uniform float uT,uFocus,uFoc,uDpr,uMax,uGain,uSm,uOff,uBk,uHalo;varying vec3 vCol,vHot,vS;'+
    'void main(){vec3 p=aP.xyz;vec4 c=uPV*vec4(p,1.);gl_Position=c;float w=max(c.w,.05),dist=length(p-uEye),s=aI.x;'+
    // depth of field: the disc grows fast in front of the focus and barely behind it
    'float cf=1.-uFocus/max(dist,.1),coc=(cf<0.?min(-cf,4.):cf*.1)*uBk*uDpr;'+
    'float sk=step(aI.w,0.),core=aI.z*uFoc/w,fl=2.2*uDpr,D=max(fl,core*8.)+coc,str=min(abs(aV)*uFoc/w*.028,(uSm>.5?36.:60.)*uDpr),Ln=min(D+str,uMax);D=min(D,uMax);gl_PointSize=Ln;'+
    'float bl=clamp(coc/(D*.7+uDpr),0.,1.);'+
    // flicker: two beating sines and a rare flare-up
    'float fk=.62+.38*sin(uT*(3.1+4.*s)+s*91.)*sin(uT*(1.3+2.1*fract(s*7.3))+s*37.)+.9*pow(max(0.,sin(uT*(.6+.9*fract(s*13.1))+s*53.)),26.);'+
    'float h=aI.y*(.82+.28*fk),hu=fract(s*5.73);vec3 col=mix(vec3(.5,.11,.02),vec3(.894,.553,.114),smoothstep(.1,.62,h));col=mix(col,vec3(1.,.8,.5),smoothstep(.8,1.2,h));col.g*=.86+.26*hu;col.b*=.8+.4*hu;'+
    'float a=aP.w*uGain*fk*clamp(core*8./fl,.3,1.)/(1.+coc*coc/(uDpr*uDpr*600.))/(1.+max(0.,dist-uFocus)*.045)*smoothstep(.5,2.6,dist)*sqrt(D/Ln);'+
    // keep the copy clear: the whole copy column on desktop (bottom left on the hero), the lower half on phones
    'vec2 n=c.xy/w;float m=uSm>.5?mix(.35+.45*uOff,1.,smoothstep(-.35,.25,n.y)):(1.-.7*uOff*(1.-smoothstep(-.12,.16,n.x)))*(1.-.6*(1.-uOff)*(1.-smoothstep(-.8,-.2,n.y))*(1.-smoothstep(-.5,-.05,n.x)));'+
    // and off the faces: soft discs everywhere, sharp ones too on phones where the figure fills the frame (not the roar's sparks, not in the portal)
    'float fi=1.-smoothstep(.55,1.05,length((n-uFg.xy)/uFg.zw)),fd=uSm>.5?mix(.65-.4*sk,.25,uOff):.25;a*=m*(1.-fi*(fd+(.85-fd)*bl));'+
    'vS=vec3(bl,Ln/D,aV<0.?-1.:1.);vCol=col*a;vHot=vec3(1.,.93,.8)*a*smoothstep(.6,1.1,h)*(1.-bl)*(1.-bl);'+
    // the halo pass: the hottest sharp embers get a wide, faint warm glow around them
    'if(uHalo>.5){float hk=smoothstep(.86,1.12,h)*(1.-bl)*step(0.,aI.w);gl_PointSize=hk>.01?min(D*4.5+7.*uDpr,uMax):0.;if(hk<=.01)gl_Position=vec4(2.,2.,2.,1.);vS=vec3(2.,1.,1.);vCol=mix(col,vec3(1.,.62,.24),.5)*a*hk*.09;vHot=vec3(0.);}}';
  // a streak is a comet: a hot point at the head, a tail that thins and fades (gl_PointCoord runs top down); at rest q=1 and it is a round ember
  var fs='precision mediump float;varying vec3 vCol,vHot,vS;'+
    'void main(){vec2 c=gl_PointCoord-.5;if(vS.x>1.5){float r=length(c)*2.;if(r>1.)discard;float gw=(1.-r)*(1.-r);gl_FragColor=vec4(vCol*gw*gw,1.);return;}float q=vS.y,h=q-1.,al=c.y*2.*q*vS.z,px=c.x*2.*q,t=clamp(al,-h,h),k=clamp(h*2.,0.,1.)*(1.-vS.x),u=h>.01?(t+h)/(2.*h)*k:0.,rw=1.-.65*u;'+ // sharp ones become comets; soft discs smear evenly
    'vec2 d=vec2(px,al-t)/rw;float r2=dot(d,d);if(r2>1.)discard;'+
    'float e=al+h,tf=(1.-u)*(1.-u),hot=exp(-(px*px+e*e)*45.)*sqrt(sqrt(q));'+ // vCol and vHot carry 1/sqrt(q): the tail spreads the light, the head keeps more of it
    'float sharp=exp(-r2*14.)+.34*exp(-r2*3.6),disc=smoothstep(1.,.72,sqrt(r2))*(.5+.5*smoothstep(.3,.92,r2));'+
    'gl_FragColor=vec4(vCol*mix(sharp,disc*.6,vS.x)*tf+vHot*hot,1.);}';

  // an ambient ember: anywhere in the volume, biased low so it drifts up through the frame; mostly behind the figure, a few beside it and near the lens
  function spawn(i,first){ var j=i*3, r=R(), z=r<.62?-2-R()*12:r<.9?-2+R()*4.5:2.6+R()*3.4, sg=R()<.5?-1:1;
    if(z>-2&&oo&&R()<.5) z=-2.5-R()*9; // the figure is pushed right of the copy: half the near ones go behind it, the rest to its right
    var hx=(sm?.55:1)*(5.5+Math.max(0,-z)*.62), hy=(sm?1.35:1)*(4.6+Math.max(0,-z)*.5), x=(R()*2-1)*hx;
    if(z>-2) x=oo?(.26+R()*.42)*(11-z)/1.6:sg*((sm?.6:1.9)+R()*hx*.9); // the ones near the figure stand beside it, not over the faces (on desktop, to its right)
    X[j]=x; X[j+1]=first?(R()*2-1)*hy:(R()*1.5-1)*hy; X[j+2]=z; V[j]=V[j+1]=V[j+2]=0;
    LF[i]=6+R()*9; AG[i]=first?R()*LF[i]:0; SD[i]=R(); HT[i]=R()<.13?.95+R()*.25:.32+R()*.45; SZ[i]=(.011+R()*.016)*(HT[i]>.9?1.35:1); RS[i]=.16+R()*.34; if(sm) SZ[i]*=1.25; }
  // a spark from the pool (roar burst or a scatter spin-off)
  function spark(k,x,y,z,vx,vy,vz,life,heat){ var i=NA+nb; nb=(nb+1)%NB; var j=i*3; X[j]=x; X[j+1]=y; X[j+2]=z; V[j]=vx; V[j+1]=vy; V[j+2]=vz;
    AG[i]=0; LF[i]=life; HT[i]=heat; SD[i]=R(); SZ[i]=(.016+R()*.016)*(sm?1.25:1); KD[i]=k; RS[i]=(R()<.5?-1:1)*(.9+R()*1.1); }

  L.embers={
    init:function(gl,env){ g=gl; sm=env.small; NA=sm?100:150; NB=sm?44:72; N=NA+NB;
      X=new Float32Array(N*3); V=new Float32Array(N*3); AG=new Float32Array(N); LF=new Float32Array(N); SD=new Float32Array(N); HT=new Float32Array(N); SZ=new Float32Array(N); RS=new Float32Array(N);
      KD=new Uint8Array(N); PR=new Float32Array(N); RA=new Float32Array(N); RR=new Float32Array(N); RZ=new Float32Array(N); RW=new Float32Array(N); DR=new Float32Array(N); DZ=new Float32Array(N); DB=new Float32Array(N*9);
      pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr);
      if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      ['uPV','uEye','uFg','uT','uFocus','uFoc','uDpr','uMax','uGain','uSm','uOff','uBk','uHalo'].forEach(function(n){ U[n]=gl.getUniformLocation(pr,n); });
      aP=gl.getAttribLocation(pr,'aP'); aI=gl.getAttribLocation(pr,'aI'); aV=gl.getAttribLocation(pr,'aV');
      bf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,bf); gl.bufferData(gl.ARRAY_BUFFER,DB,gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER,null);
      var pz=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); PMAX=Math.min(pz&&pz[1]?pz[1]:64,sm?130:150);
      for(var i=0;i<N;i++){ if(i<NA) spawn(i,1); else { AG[i]=LF[i]=1; }
        // each slot's place in the portal: most on the ring itself, some strung along a tube the camera dives down
        var t=R(); PR[i]=i<NA&&t<.78?1:0; RA[i]=R()*6.2832; RW[i]=.6+R()*.8;
        if(R()<.55){ RR[i]=3.05+(R()-.5)*.8; RZ[i]=(R()-.5)*1.2; } else { RZ[i]=-4+R()*10; RR[i]=3.05*(1+.05*RZ[i])+(R()-.5)*.7; }
        DR[i]=.45+Math.sqrt(R())*2.4; DZ[i]=-9+R()*20; } // and where it hangs in the tunnel the camera dives down
    },
    back:function(s){
      var gl=s.gl, T=s.T, red=s.reduced, dt=red?s.dt*.5:s.dt, i, j, PV=s.PV, eye=s.eye;
      var gap=lastT<0||T-lastT>.3||T<lastT; if(gap){ pPa=s.pa; pSc=s.scat; pFl=s.fl; ppx=s.px; ppy=s.py; } lastT=T; // first frame, or shown again after a while: no stale events
      var Hh=Math.max(1,s.H), t=Math.hypot(PV[1],PV[5],PV[9]), foc=t*Hh*.5, fd=Math.hypot(eye[0],eye[1]-.2,eye[2]), ppu=Math.max(foc/Math.max(fd,.5),1e-3); oo=!s.small&&s.offX>.17?1:0;
      var vs=red?0:s.vY*s.dpr/ppu*.5; // the scroll streams them at half the page's speed (at the figure's depth)
      // portal: drawn into the ring as it forms, held through the dive, let go as the hero comes back
      var pass=s.A==='portal'&&s.B==='hero', wP=0, wD=pass&&!red?sstep(.03,.24,s.tau):0; if(s.A==='portal') wP=pass?1-sstep(.44,.7,s.tau):1-s.tau; if(s.B==='portal') wP=Math.max(wP,s.tau); if(red) wP=0;
      wPs=gap?wP:wPs+(wP-wPs)*(1-Math.exp(-dt*4)); if(wPs<.001) wPs=0;
      var wind=pass?Math.pow(sstep(.1,.5,s.tau),2):0; ph+=dt*(.22+1.8*wind);
      if(!red){
        // the roar: a burst off the mane on each flare
        if(s.pa>.5&&pPa<=.5){ var nr=sm?18:28; for(i=0;i<nr;i++){ var th=Math.PI*(oo?.12+.63*R():.06+.88*R()), rr=2.5+R()*.8, sp=1.5+R()*2.4, ca=Math.cos(th), sa=Math.sin(th);
          spark(1,ca*rr*1.05,.4+sa*rr,(R()-.5)*1.4,ca*sp*(oo?(ca<0?.35:.45):1),(sa*.7+.55)*sp,(R()-.5)*.8,1.7+R()*1.6,1+R()*.25); } } // on desktop, up and to the right, off the headline
        // the scatter: a few spin off the cloud as it lets go
        var ds=s.scat-pSc; if(ds>0&&s.A!=='portal'){ acc+=ds*(sm?2.4:3.8); while(acc>=1){ acc-=1;
          var a2=R()*6.2832, ru=(1.2+s.scat*.9)*(.5+R()*.6), dr=R()<.5?-1:1, sp2=1.6+R()*2;
          spark(2,Math.sin(a2)*ru,.2+(R()*2-1)*2.6,Math.cos(a2)*ru*.7,(Math.cos(a2)*dr+Math.sin(a2)*.5)*sp2,.3+R()*.6,(-Math.sin(a2)*dr+Math.cos(a2)*.5)*sp2,2+R()*1.6,.9+R()*.3); } }
        // a crackle: now and then a glowing ember spits a quick spark upward
        if(!gap&&s.intro>=1&&wPs<.05&&T>=nCk){ nCk=T+(sm?1.3:.8)+R()*(sm?2:1.6);
          for(var tr=0;tr<6;tr++){ var ci=(R()*NA)|0, cj=ci*3; if(AG[ci]>1.4&&AG[ci]<LF[ci]-2.4&&X[cj+2]<1.5){ var up=1.9+R()*1.6, sd2=(R()*2-1)*.7;
            spark(3,X[cj],X[cj+1],X[cj+2],sd2,up,(R()*2-1)*.35,.45+R()*.45,1.1+R()*.2); if(R()<.35) spark(3,X[cj],X[cj+1],X[cj+2],-sd2*.8,up*.75,(R()*2-1)*.35,.35+R()*.3,1.05+R()*.2); break; } } }
      }
      var dfl=Math.max(0,s.fl-pFl)*(red?0:1), fh=red?0:.5*s.fl, kd=1-Math.exp(-dt*1.2), cy=(s.A==='roar'||s.B==='roar')?.4:.25, pa=red?0:s.pa;
      // pointer wind: the eased pointer's velocity, in NDC per second
      var pvx=dt>0?(s.px-ppx)/dt:0, pvy=dt>0?(s.py-ppy)/dt:0, pw=s.pIn&&dt>0?Math.min(1,Math.hypot(pvx,pvy)*.4):0, asp=Math.max(1,s.W)/Hh;
      var o=0, nw=0, wv=1+.8*s.wave;
      for(i=0;i<N;i++){
        j=i*3; var ag=AG[i], lf=LF[i]; if(i>=NA&&ag>=lf) continue;
        var x=X[j], y=X[j+1], z=X[j+2], sd=SD[i], k=KD[i], la, ht=HT[i];
        if(i<NA){
          if(dt>0){
            V[j]+=(.16*Math.sin(y*.5+T*.21+sd*20)+.07*Math.sin(T*.53+sd*41)-V[j])*kd; V[j+1]+=(RS[i]*wv-V[j+1])*kd; V[j+2]+=(.12*Math.cos(x*.4+T*.17+sd*13)-V[j+2])*kd;
            // the roar breathes them in and throws them out; the tomb flash pushes them back
            var dx=x, dy=y-cy, dz=z, dd=Math.sqrt(dx*dx+dy*dy+dz*dz)+.3, im=(pa*1.6*dt+dfl*4.2)*Math.exp(-dd*.12)/dd;
            if(im!==0){ V[j]+=dx*im; V[j+1]+=dy*im; V[j+2]+=dz*im; }
            if(pw>0){ var cw=PV[3]*x+PV[7]*y+PV[11]*z+PV[15]; if(cw>.5){ var nx=(PV[0]*x+PV[4]*y+PV[8]*z+PV[12])/cw-s.px, ny=(PV[1]*x+PV[5]*y+PV[9]*z+PV[13])/cw-s.py, q=nx*nx*asp*asp+ny*ny;
              if(q<.12){ var f=(1-q/.12)*pw*.9*cw/t; V[j]+=pvx*f*asp*dt*(eye[2]>=0?1:-1); V[j+1]+=pvy*f*dt; } } }
            x+=V[j]*dt; y+=(V[j+1]+vs)*dt; z+=V[j+2]*dt;
            var hy=(sm?1.35:1)*(4.6+Math.max(0,-z)*.5)+1.5; if(y>hy) y-=2*hy; else if(y<-hy) y+=2*hy;
            X[j]=x; X[j+1]=y; X[j+2]=z; ag+=dt; AG[i]=ag;
            if(ag>lf){ spawn(i,0); x=X[j]; y=X[j+1]; z=X[j+2]; ag=0; lf=LF[i]; ht=HT[i]; sd=SD[i]; }
          }
          la=sstep(0,1.4,ag)*(1-sstep(lf-2.4,lf,ag)); ht=ht*(1-.3*ag/lf)+fh;
          var mw=0; if(wPs>0&&PR[i]>0){ mw=wPs*PR[i]; var zr=RZ[i]+(DZ[i]-RZ[i])*wD, an=RA[i]+ph*RW[i]+zr*.12, rr2=RR[i]+(DR[i]-RR[i])*wD;
            x+=(Math.cos(an)*rr2-x)*mw; y+=(.25+Math.sin(an)*rr2-y)*mw; z+=(zr-z)*mw; la+=(1-la)*mw; ht+=.18*mw; }
        } else {
          if(dt>0){ var dg=Math.exp(-dt*(k===1?1.5:k===3?2.6:1.1)); V[j]*=dg; V[j+1]=V[j+1]*dg+dt*(k===1?.9:k===3?.2:.35); V[j+2]*=dg;
            if(k===2){ var w2=RS[i]*dt, c2=Math.cos(w2), s2=Math.sin(w2), vx=V[j]; V[j]=vx*c2-V[j+2]*s2; V[j+2]=vx*s2+V[j+2]*c2; } // spin
            x+=V[j]*dt; y+=(V[j+1]+vs)*dt; z+=V[j+2]*dt; X[j]=x; X[j+1]=y; X[j+2]=z; ag+=dt; AG[i]=ag; if(ag>=lf) continue; }
          la=k===3?sstep(0,.05,ag)*(1-sstep(lf*.25,lf,ag)):sstep(0,.12,ag)*(1-sstep(lf*.4,lf,ag)); ht=ht*(1-.55*ag/lf)+fh;
        }
        if(la<.004) continue;
        DB[o]=x; DB[o+1]=y; DB[o+2]=z; DB[o+3]=la; DB[o+4]=sd; DB[o+5]=ht; DB[o+6]=SZ[i]; DB[o+7]=i<NA?1-mw*.999:-1;
        DB[o+8]=vs+(i<NA?V[j+1]*2.2*(1-mw):V[j+1]); o+=9; nw++; // streak: the page's scroll plus the ember's own rise (drawn longer, so the quick ones trail a faint tail)
      }
      pPa=s.pa; pSc=s.scat; pFl=s.fl; ppx=s.px; ppy=s.py;
      if(!nw) return;
      // where the figure sits on screen, so soft discs stay off the faces
      var fw=PV[7]*.2+PV[15], fx=99, fy=99, rx=.01, ry=.01; if(fw>.5){ fx=(PV[4]*.2+PV[12])/fw; fy=(PV[5]*.2+PV[13])/fw; ry=3.5*t/fw; rx=3.1*t/asp/fw; }
      gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER,bf); gl.bufferSubData(gl.ARRAY_BUFFER,0,DB);
      gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP,4,gl.FLOAT,false,36,0); gl.enableVertexAttribArray(aI); gl.vertexAttribPointer(aI,4,gl.FLOAT,false,36,16);
      gl.enableVertexAttribArray(aV); gl.vertexAttribPointer(aV,1,gl.FLOAT,false,36,32);
      gl.uniformMatrix4fv(U.uPV,false,PV); gl.uniform3f(U.uEye,eye[0],eye[1],eye[2]); gl.uniform4f(U.uFg,fx,fy,rx,ry);
      gl.uniform1f(U.uT,red?T*.5:T); gl.uniform1f(U.uFocus,fd-.5); gl.uniform1f(U.uFoc,foc); gl.uniform1f(U.uDpr,s.dpr); gl.uniform1f(U.uMax,PMAX);
      gl.uniform1f(U.uSm,s.small?1:0); gl.uniform1f(U.uOff,s.small?wPs:Math.min(1,Math.max(0,s.offX/.34))); gl.uniform1f(U.uBk,s.small?34:42);
      gl.uniform1f(U.uGain,(s.small?1.4:1.25)*sstep(0,1,s.intro)*(1+.25*s.wave)*(1+(red?.5:2.2)*s.fl));
      gl.uniform1f(U.uHalo,1); gl.drawArrays(gl.POINTS,0,nw); // glow first, embers on top
      gl.uniform1f(U.uHalo,0); gl.drawArrays(gl.POINTS,0,nw);
      gl.disableVertexAttribArray(aP); gl.disableVertexAttribArray(aI); gl.disableVertexAttribArray(aV); gl.bindBuffer(gl.ARRAY_BUFFER,null);
    },
    front:function(s){}
  };
})();
