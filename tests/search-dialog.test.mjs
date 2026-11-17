import test from 'node:test';
import assert from 'node:assert/strict';
import {bindSearchDialog} from '../src/components/SearchDialog/controller.ts';
function event(type, properties={}) {const e=new Event(type,{cancelable:true});Object.assign(e,properties);return e;}
function fixture({asyncClose=false}={}) {
 const document=new EventTarget();document.body={style:{overflow:'auto'}};
 const focus=[];const input={focus:()=>focus.push('input'),select:()=>focus.push('select')};
 const trigger=new EventTarget();trigger.dataset={};trigger.focus=()=>focus.push('trigger');trigger.ownerDocument=document;
 const dialog=new EventTarget();dialog.ownerDocument=document;dialog.open=false;dialog.querySelector=()=>input;dialog.getBoundingClientRect=()=>({left:100,right:700,top:80,bottom:500});
 const pendingClose=[];
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;if(asyncClose)pendingClose.push(()=>dialog.dispatchEvent(new Event('close')));else dialog.dispatchEvent(new Event('close'));};
 const controller=bindSearchDialog(dialog,trigger);
 return {document,dialog,trigger,controller,focus,flushClose:()=>pendingClose.splice(0).forEach(run=>run())};
}
test('pointer trigger opens modal with search focus, locks scrolling and restores pointer focus without ring on close',()=>{
 const f=fixture();f.trigger.dispatchEvent(event('click',{detail:1}));assert.equal(f.dialog.open,true);assert.deepEqual(f.focus,['input','select']);assert.equal(f.document.body.style.overflow,'hidden');
 f.controller.close();assert.equal(f.dialog.open,false);assert.equal(f.document.body.style.overflow,'auto');assert.equal(f.focus.at(-1),'trigger');assert.equal(f.trigger.dataset.pointerFocus,'true');
 f.document.dispatchEvent(event('keydown',{key:'Tab'}));assert.equal(f.trigger.dataset.pointerFocus,undefined);f.controller.dispose();
});
test('Cmd/Ctrl K opens dialog before plugin shortcut can target hidden input; arrows/Enter remain plugin-owned',()=>{
 for(const modifier of ['metaKey','ctrlKey']) {
  const f=fixture();const shortcut=event('keydown',{key:'k',[modifier]:true});f.document.dispatchEvent(shortcut);assert.equal(f.dialog.open,true);assert.equal(shortcut.defaultPrevented,true);
  for(const key of ['ArrowDown','ArrowUp','Enter']){const e=event('keydown',{key});f.document.dispatchEvent(e);assert.equal(e.defaultPrevented,false);assert.equal(f.dialog.open,true);}
  const escape=event('keydown',{key:'Escape'});f.document.dispatchEvent(escape);assert.equal(f.dialog.open,false);assert.equal(f.focus.at(-1),'trigger');assert.equal(f.trigger.dataset.pointerFocus,undefined);f.controller.dispose();
 }
});
test('backdrop closes while dialog padding clicks do not; route close uses the same cleanup',()=>{
 const f=fixture();f.controller.open();f.dialog.dispatchEvent(event('click',{clientX:200,clientY:100}));assert.equal(f.dialog.open,true);
 f.document.dispatchEvent(event('pointerdown'));f.dialog.dispatchEvent(event('click',{clientX:20,clientY:20}));assert.equal(f.dialog.open,false);
 f.controller.open();f.controller.close();assert.equal(f.document.body.style.overflow,'auto');f.controller.dispose();
});
test('disposing removes document shortcuts, unlocks scrolling and never reopens a detached dialog',()=>{
 const f=fixture();f.controller.open();f.controller.dispose();assert.equal(f.dialog.open,false);assert.equal(f.document.body.style.overflow,'auto');
 f.document.dispatchEvent(event('keydown',{key:'k',ctrlKey:true}));assert.equal(f.dialog.open,false);
});

test('pointer opening keeps ring suppression after Escape until the next outside-modal keyboard event',()=>{
 const f=fixture();f.trigger.dispatchEvent(event('click',{detail:1}));
 f.document.dispatchEvent(event('keydown',{key:'Escape'}));assert.equal(f.dialog.open,false);assert.equal(f.trigger.dataset.pointerFocus,'true');
 f.document.dispatchEvent(event('keydown',{key:'Tab'}));assert.equal(f.trigger.dataset.pointerFocus,undefined);f.controller.dispose();
});
test('dispose unlocks body synchronously when native close event is queued',()=>{
 const f=fixture({asyncClose:true});f.controller.open();assert.equal(f.document.body.style.overflow,'hidden');
 f.controller.dispose();assert.equal(f.document.body.style.overflow,'auto');
 const focused=f.focus.length;f.flushClose();assert.equal(f.focus.length,focused);assert.equal(f.document.body.style.overflow,'auto');
});
test('a queued prior close event cannot unlock or steal focus from a reopened modal',()=>{
 const f=fixture({asyncClose:true});f.controller.open();f.controller.close();f.controller.open();
 const focused=f.focus.length;f.flushClose();assert.equal(f.dialog.open,true);assert.equal(f.document.body.style.overflow,'hidden');assert.equal(f.focus.length,focused);
 f.controller.dispose();assert.equal(f.document.body.style.overflow,'auto');
});
