import {studyTopics} from './learn-topics.js';

// Keep the book moving when a browser cannot create a WebGL context.
export function createFallbackBook(host){
 const stage=host.closest('.learn-stage'),book=document.createElement('div');
 book.className='learn-css-book';host.dataset.bookRenderer='css';
 const left=document.createElement('div'),right=document.createElement('div'),leaf=document.createElement('div'),front=document.createElement('div'),back=document.createElement('div');
 left.className='learn-css-page learn-css-left';right.className='learn-css-page learn-css-right';leaf.className='learn-css-leaf';front.className='learn-css-page learn-css-front';back.className='learn-css-page learn-css-back';
 leaf.append(front,back);book.append(left,right,leaf);host.append(book);leaf.hidden=true;
 function page(element,index){const topic=studyTopics[index%studyTopics.length];element.replaceChildren();for(const [tag,text] of [['imprint','PILOTDESK / LEARN'],['title',topic.lines.join(' ')],['subtitle',topic.subtitle],...topic.subjects.map(text=>['subject',text]),['colophon','PILOT KNOWLEDGE / STUDY NOTES']]){const node=document.createElement('div');node.className='learn-css-'+tag;node.textContent=text;element.append(node)}}
 let index=0,turns=0,timer=0,deadline=0,remaining=900,onScreen=false,disposed=false,animation=null;
 const available=()=>!disposed&&onScreen&&!document.hidden;
 function spread(){page(left,index);page(right,index+1);host.dataset.leftTopic=studyTopics[index].title;host.dataset.rightTopic=studyTopics[(index+1)%4].title;host.dataset.pageTurns=String(turns)}
 function start(){timer=0;if(!available())return;page(front,index+1);page(back,index+2);page(right,index+3);leaf.hidden=false;
  animation=leaf.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(-180deg)'}],{duration:2100,easing:'cubic-bezier(.42,0,.2,1)',fill:'forwards'});
  animation.onfinish=()=>{index=(index+2)%4;turns++;spread();leaf.hidden=true;animation.cancel();animation=null;remaining=4200;schedule()};
 }
 function schedule(){if(!available()||timer||animation)return;deadline=performance.now()+remaining;timer=setTimeout(start,remaining)}
 function pause(){if(timer){remaining=Math.max(0,deadline-performance.now());clearTimeout(timer);timer=0}animation?.pause()}
 function update(){if(!available()){pause();return}if(animation)animation.play();else schedule()}
 const observer=new IntersectionObserver(entries=>{onScreen=entries.some(e=>e.isIntersecting);update()},{threshold:.08});observer.observe(host);document.addEventListener('visibilitychange',update);
 spread();stage?.classList.add('has-scene');
 return{render(){},dispose(){disposed=true;pause();animation?.cancel();observer.disconnect();document.removeEventListener('visibilitychange',update);book.remove();stage?.classList.remove('has-scene')}};
}
