"use strict";var eventRegistry={};function trigger(t,e){if(eventRegistry[t])for(var n,r=0,a=eventRegistry[t].length;n=eventRegistry[t][r],r<a;r+=1){if(!1===n(e))break}}function on(t,e){eventRegistry[t]||(eventRegistry[t]=[]),eventRegistry[t].push(e)}function off(t,e){if(eventRegistry[t])if("function"==typeof e){var n=eventRegistry[t].indexOf(e);n>=0&&eventRegistry[t].splice(n,1)}else eventRegistry[t]=[]}function one(t,e){var n=function(r){off(t,n),e(r)};on(t,n)}var events=Object.freeze({trigger:trigger,on:on,off:off,one:one}),data={},trigger$1=trigger;function mirror(){return this}function deepFreeze(t){if(null===t||"function"==typeof t.toJS||"object"!=typeof t)return t;for(var e=Object.getOwnPropertyNames(t),n={toJS:{value:mirror.bind(t)}},r=function(t,r){n[e[t]]={enumerable:!0,get:function(){return deepFreeze(r)},set:function(n){throw new Error('Cannot change property "'+e[t]+'" to "'+n+'" of an immutable object')}}},a=0,o=void 0;o=t[e[a]],a<e.length;a+=1)r(a,o);return Object.freeze(Object.create(Object.getPrototypeOf(t),n))}var Store=function(t,e){var n=this;this.name=t||"unnamed",Object.keys(events).forEach(function(e){n[e]=function(n,r){events[e](t+"-store:"+n,r)}});for(var r=Object.keys(e),a=function(e,a){n[r[e]]=function(e){var n=a(data[t].currentData.toJS(),e,this.next.bind(this));n&&this.next(n)}.bind(n)},o=0,i=void 0;i=e[r[o]],o<r.length;o+=1)a(o,i);data[t]=data[t]||{loaded:!1,currentData:deepFreeze([]),historicData:[]}},prototypeAccessors={data:{configurable:!0}};prototypeAccessors.data.get=function(){return data[this.name]?data[this.name].currentData.toJS():null},Store.prototype.next=function(t){if(data[this.name].loaded=!0,(t=deepFreeze(t))!==data[this.name].currentData){for(data[this.name].historicData.push(data[this.name].currentData);data[this.name].historicData.length>10;)data[this.name].historicData.shift();data[this.name].currentData=t,trigger$1(this.name+"-store:changed",data[this.name].currentData.toJS())}},Store.prototype.previous=function(){data[this.name].historicData.length<1||(newState=data[this.name].historicData.pop(),data[this.name].currentData=newState,trigger$1(this.name+"-store:changed",data[this.name].currentData.toJS()))},Object.defineProperties(Store.prototype,prototypeAccessors),module.exports=Store;
