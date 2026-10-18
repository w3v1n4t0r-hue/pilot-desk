/* A quiet, full-bleed gallery. Navigation lives in the header. */
(() => {
  'use strict';
  const root = document.querySelector('[data-hero-prototype]');
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-slide]')];
  const track = root.querySelector('.hp-track');
  const status = root.querySelector('[data-slide-status]');
  const duration = 5000;
  const travel = 950;
  // The homepage starts its approved animation automatically for every visitor.
  const motionOverride = true;
  const motionOff = () => false;
  let index = 0, remaining = duration, started = 0, timer = 0, transitionTimer = 0;
  let manualPause = false, focused = false, visible = true, transitioning = false, openingReady = false, touching = false;
  let touchStart = null;
  const blocked = () => manualPause || focused || touching || !visible || document.hidden || motionOff() || transitioning || !openingReady;
  const focusWithin = () => root.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
  function cloneEdge(slide) {
    const clone = slide.cloneNode(true); clone.removeAttribute('data-slide'); clone.dataset.heroClone = '';
    clone.inert = true; clone.setAttribute('aria-hidden', 'true'); clone.classList.add('is-settled');
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    return clone;
  }
  track.prepend(cloneEdge(slides.at(-1)));track.append(cloneEdge(slides[0]));
  root.style.setProperty('--hp-index', 1);
  function stopClock() {
    if (!timer) return;
    clearTimeout(timer);remaining = Math.max(0, remaining - (performance.now() - started));timer = 0;
  }
  function sync() {
    stopClock();
    root.classList.toggle('is-reduced', motionOff());root.classList.toggle('motion-opt-in', motionOverride);
    root.classList.toggle('is-suspended', !visible || document.hidden);
    root.dataset.motionOverride = String(motionOverride);root.dataset.heroIndex = index;root.dataset.transitioning=String(transitioning);
    root.dataset.scenePaused = String(manualPause || motionOff() || !visible || document.hidden);
    for(const slide of slides){
      const animation=slide._heroOpening;
      if(!animation)continue;
      if(manualPause||!visible||document.hidden){if(animation.playState!=='paused')animation.pause()}
      else if(animation.playState==='paused')animation.play();
    }
    root.dispatchEvent(new CustomEvent('hero:state'));
    if (!blocked()) {started = performance.now();timer = setTimeout(() => {timer = 0;show(index + 1)}, remaining)}
  }
  function enter(slide) {
    openingReady = motionOff();slide.classList.remove('is-settled', 'is-entering');
    if (motionOff()) {slide.classList.add('is-settled');return}
    slide.classList.add('is-entering');
    const animation = slide.animate([{opacity:1},{opacity:1}], {duration:1500});slide._heroOpening = animation;
    animation.ready.then(() => {if(slide===slides[index]){openingReady=true;sync()}}).catch(()=>{});
    if (manualPause || !visible || document.hidden) animation.pause();
    animation.finished.then(() => {
      if(slide!==slides[index])return;
      slide.classList.add('is-settled');slide.classList.remove('is-entering');slide._heroOpening=null;
    }).catch(()=>{});
  }
  function show(next, manual = false) {
    if(transitioning)return;
    stopClock();const previous=index,target=(next+slides.length)%slides.length;
    if(target===index){remaining=duration;sync();return}
    slides[index]._heroOpening?.cancel();slides[index]._heroOpening=null;slides[index].classList.remove('is-active','is-entering');
    slides[target].querySelector('.hp-frozen')?.remove();slides[target].classList.remove('is-settled','is-entering');slides[target].classList.add('is-preparing');
    index=target;remaining=duration;openingReady=false;transitioning=!motionOff();
    const forward=previous===slides.length-1&&next===slides.length,backward=previous===0&&next===-1;
    if(forward||backward){const edge=forward?track.lastElementChild:track.firstElementChild;edge.classList.remove('is-settled','is-entering');edge.classList.add('is-preparing');}
    root.style.setProperty('--hp-index',forward?slides.length+1:backward?0:index+1);
    slides.forEach((slide,i)=>{slide.inert=i!==index;slide.setAttribute('aria-hidden',String(i!==index))});
    const settled=()=>{
      transitioning=false;slides[index].classList.remove('is-preparing');slides[index].classList.add('is-active');enter(slides[index]);
      if(manual)status.textContent=`${slides[index].getAttribute('aria-label')} scene`;
      root.dispatchEvent(new CustomEvent('hero:enter'));sync();
    };
    const finish=()=>{
      if(forward||backward){root.classList.add('is-normalizing');root.style.setProperty('--hp-index',index+1);requestAnimationFrame(()=>requestAnimationFrame(()=>{root.classList.remove('is-normalizing');settled()}))}
      else settled();
    };
    clearTimeout(transitionTimer);if(transitioning)transitionTimer=setTimeout(finish,travel);else{root.style.setProperty('--hp-index',index+1);settled()}
    sync();
  }
  root.classList.add('is-ready');slides.forEach((slide,i)=>{slide.inert=i!==0;slide.setAttribute('aria-hidden',String(i!==0))});
  slides[0].classList.add('is-active');focused=focusWithin();
  root.addEventListener('focusin',()=>{focused=focusWithin();sync()});
  root.addEventListener('focusout',()=>queueMicrotask(()=>{focused=focusWithin();sync()}));
  root.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1),true)}
    if(event.code==='Space'&&!event.target.closest('button,a,input,textarea,select,[contenteditable]')){
      event.preventDefault();
      manualPause=!manualPause;
      remaining=duration;focused=false;sync();
    }
  });
  root.querySelector('[data-hero-prev]').addEventListener('click',()=>show(index-1,true));
  root.querySelector('[data-hero-next]').addEventListener('click',()=>show(index+1,true));
  const viewport=root.querySelector('.hp-viewport');let drag=null,suppressClick=false;
  viewport.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0||transitioning||event.target.closest('a,button'))return;
    drag={x:event.clientX,dx:0,id:event.pointerId};touching=true;sync();viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;drag.dx=event.clientX-drag.x;
    if(Math.abs(drag.dx)>6){root.classList.add('is-dragging');track.style.transform=`translateX(calc(${index+1} * -100% + ${drag.dx}px))`;}
  });
  function releaseDrag(event){
    if(!drag||event.pointerId!==drag.id)return;
    const dx=drag.dx;drag=null;touching=false;suppressClick=Math.abs(dx)>6;
    root.classList.remove('is-dragging');track.style.removeProperty('transform');
    if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
    if(event.type!=='pointercancel'&&Math.abs(dx)>50)show(index+(dx<0?1:-1),true);else sync();
  }
  viewport.addEventListener('pointerup',releaseDrag);viewport.addEventListener('pointercancel',releaseDrag);
  viewport.addEventListener('dragstart',event=>event.preventDefault());
  viewport.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false}},true);
  root.addEventListener('touchstart',event=>{touching=true;touchStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;sync()},{passive:true});
  root.addEventListener('touchend',event=>{
    touching=false;
    if(touchStart){const end=event.changedTouches[0],dx=end.clientX-touchStart.x,dy=end.clientY-touchStart.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)show(index+(dx<0?1:-1),true)}
    touchStart=null;sync();
  },{passive:true});
  root.addEventListener('touchcancel',()=>{touching=false;touchStart=null;sync()},{passive:true});
  root.querySelector('.hp-viewport').addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>8&&Math.abs(event.deltaX)>Math.abs(event.deltaY)*1.3){event.preventDefault();if(!transitioning)show(index+(event.deltaX>0?1:-1),true)}},{passive:false});
  function suspend(){sync()}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;suspend()},{threshold:0}).observe(root);
  document.addEventListener('visibilitychange',suspend);window.addEventListener('pageshow',sync);
  root.querySelectorAll('[data-scene-poster]').forEach(image=>{const fail=()=>{image.hidden=true;image.closest('[data-hero-scene]').querySelector('.hp-scene-unavailable').hidden=false};image.addEventListener('error',fail);if(image.complete&&!image.naturalWidth)fail()});
  const chart=new Image();
  chart.onerror=()=>root.querySelectorAll('[data-hero-scene=plan] .hp-scene-unavailable').forEach(message=>{message.hidden=false});
  chart.src='/assets/hero-scenes/orlando-sectional.webp';
  const header=document.querySelector('.topbar');
  if(header)new ResizeObserver(()=>root.style.setProperty('--hp-header-height',header.getBoundingClientRect().height+'px')).observe(header);
  enter(slides[0]);sync();
})();
