(this["webpackJsonpflood-fill"]=this["webpackJsonpflood-fill"]||[]).push([[0],{264:function(e,t,n){},265:function(e,t,n){"use strict";n.r(t);var a=n(0),o=n.n(a),r=n(90),i=n.n(r),c=(n(98),n(92)),l=n(15),u=n(11),h=n(34),s=n(33),d=n(32),m=n(35),f=n(3),p=n(54),v=(n(264),n(91));function g(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}var C=function(e){function t(e){var n;return Object(l.a)(this,t),(n=Object(h.a)(this,Object(s.a)(t).call(this,e))).canvasRef=void 0,n.canvasRef=e.canvasRef||o.a.createRef(),n}return Object(m.a)(t,e),Object(u.a)(t,[{key:"render",value:function(){var e=this.props.imgData;return o.a.createElement("canvas",Object.assign({},function(e){var t=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?g(n,!0).forEach((function(t){Object(v.a)(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):g(n).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({},e);return delete t.imgData,delete t.canvasRef,t}(this.props),{ref:this.canvasRef,width:e.width,height:e.height}))}},{key:"componentDidMount",value:function(){this.renderImgData()}},{key:"componentDidUpdate",value:function(){this.renderImgData()}},{key:"renderImgData",value:function(){this.canvasRef.current.getContext("2d").putImageData(this.props.imgData,0,0)}}]),t}(o.a.Component);var k=function(){function e(t){Object(l.a)(this,e),this.data=void 0,this.dequeueIndex=void 0,this.data=t,this.dequeueIndex=0}return Object(u.a)(e,null,[{key:"empty",value:function(){return new e([])}}]),Object(u.a)(e,[{key:"enqueue",value:function(e){this.data.push(e)}},{key:"dequeue",value:function(){if(this.hasItem()){var e=this.data[this.dequeueIndex];return this.data[this.dequeueIndex]=void 0,this.dequeueIndex++,e}throw new Error("Cannot dequeue an item from an empty queue.")}},{key:"hasItem",value:function(){return this.dequeueIndex<this.data.length}}]),e}(),y=function(){function e(){Object(l.a)(this,e),this.undoStack=void 0,this.redoStack=void 0,this.undoStack=[],this.redoStack=[]}return Object(u.a)(e,null,[{key:"fromCurrent",value:function(t){var n=e.empty();return n.push(t),n}},{key:"empty",value:function(){return new e}}]),Object(u.a)(e,[{key:"undo",value:function(){if(!this.canUndo())throw new Error("Cannot undo nothing.");var e=this.undoStack.pop();return this.redoStack.push(e),e}},{key:"canUndo",value:function(){return this.undoStack.length>1}},{key:"redo",value:function(){if(!this.canRedo())throw new Error("Cannot redo nothing.");var e=this.redoStack.pop();return this.undoStack.push(e),e}},{key:"canRedo",value:function(){return this.redoStack.length>0}},{key:"push",value:function(e){this.undoStack.push(e),this.redoStack=[]}},{key:"current",value:function(){return 0===this.undoStack.length?f.a.none():f.a.some(this.undoStack[this.undoStack.length-1])}},{key:"past",value:function(){return this.undoStack.slice(0,-1)}},{key:"future",value:function(){return this.redoStack.slice().reverse()}}]),e}();function b(e){return function(e){return new Promise((function(t,n){var a=new FileReader;a.addEventListener("load",(function(){return t(a.result)})),a.addEventListener("error",(function(){return n(a.error)})),a.readAsDataURL(e)}))}(e).then((function(e){return new Promise((function(t,n){var a=document.createElement("img");a.src=e,a.addEventListener("load",(function(){return t(a)})),a.addEventListener("error",n)}))}))}function w(e,t,n,a){var o,r=(o=e,new ImageData(o.data.slice(),o.width,o.height)),i=E(n),c=S(r,t),l=function(e,t){var n=t.tolerance,a=t.shouldCompareAlpha,o=n*n;return a?function(t){var n=e.r-t.r,a=e.g-t.g,r=e.b-t.b,i=e.a-t.a;return n*n+a*a+r*r+i*i<=o}:function(t){var n=e.r-t.r,a=e.g-t.g,r=e.b-t.b;return n*n+a*a+r*r<=o}}(c,a);if(O(i,c))return r;var u=e.width,h=e.height;R(r,t,i);var s=k.empty();for(s.enqueue(t);s.hasItem();){var d=s.dequeue();j(d).ifSome((function(e){var t=S(r,e);l(t)&&!O(i,t)&&(R(r,e,i),s.enqueue(e))})),x(d).ifSome((function(e){var t=S(r,e);l(t)&&!O(i,t)&&(R(r,e,i),s.enqueue(e))})),B(d,u).ifSome((function(e){var t=S(r,e);l(t)&&!O(i,t)&&(R(r,e,i),s.enqueue(e))})),D(d,h).ifSome((function(e){var t=S(r,e);l(t)&&!O(i,t)&&(R(r,e,i),s.enqueue(e))}))}return r}function E(e){return{r:e.r,g:e.g,b:e.b,a:Math.floor(255*(void 0===e.a?1:e.a))}}function S(e,t){var n=t.x,a=t.y,o=e.width,r=e.height,i=e.data;if(n>=o)throw new RangeError("X coordinate exceeded image width.");if(a>=r)throw new RangeError("Y coordinate exceeded image height.");var c=4*(a*o+n);return{r:i[c],g:i[c+1],b:i[c+2],a:i[c+3]}}function O(e,t){return e.r===t.r&&e.g===t.g&&e.b===t.b&&e.a===t.a}function R(e,t,n){var a=t.x,o=t.y,r=e.width,i=e.height,c=e.data;if(a>=r)throw new RangeError("X coordinate exceeded image width.");if(o>=i)throw new RangeError("Y coordinate exceeded image height.");var l=4*(o*r+a);c[l]=n.r,c[l+1]=n.g,c[l+2]=n.b,c[l+3]=n.a}function j(e){var t=e.x,n=e.y;return t>0?f.a.some({x:t-1,y:n}):f.a.none()}function x(e){var t=e.x,n=e.y;return n>0?f.a.some({x:t,y:n-1}):f.a.none()}function B(e,t){var n=e.x,a=e.y;return n<t-1?f.a.some({x:n+1,y:a}):f.a.none()}function D(e,t){var n=e.x,a=e.y;return a<t-1?f.a.some({x:n,y:a+1}):f.a.none()}var I=function(e){function t(e){var n;return Object(l.a)(this,t),(n=Object(h.a)(this,Object(s.a)(t).call(this,e))).mainCanvasRef=void 0,window.app=Object(d.a)(n),n.state={originalImg:f.a.none(),fileName:f.a.none(),shouldBackdropBeCheckered:!0,backdropColorHex:"#222222",history:f.a.none(),replacementColor:f.a.none(),toleranceStr:"0",shouldCompareAlpha:!1},n.bindMethods(),n.mainCanvasRef=o.a.createRef(),n}return Object(m.a)(t,e),Object(u.a)(t,[{key:"bindMethods",value:function(){this.onKeyDown=this.onKeyDown.bind(this),this.onFileChange=this.onFileChange.bind(this),this.onReplacementColorChangeComplete=this.onReplacementColorChangeComplete.bind(this),this.onCanvasClick=this.onCanvasClick.bind(this),this.onToleranceChange=this.onToleranceChange.bind(this),this.onShouldCompareAlphaChange=this.onShouldCompareAlphaChange.bind(this),this.onUndoClick=this.onUndoClick.bind(this),this.onRedoClick=this.onRedoClick.bind(this),this.onBackdropColorChangeComplete=this.onBackdropColorChangeComplete.bind(this),this.onShouldBackdropBeCheckeredChange=this.onShouldBackdropBeCheckeredChange.bind(this)}},{key:"componentDidMount",value:function(){window.addEventListener("keydown",this.onKeyDown)}},{key:"componentWillUnmount",value:function(){window.removeEventListener("keydown",this.onKeyDown)}},{key:"onKeyDown",value:function(e){var t=this;document.activeElement===document.body&&"z"===e.key.toLowerCase()&&(e.ctrlKey||e.metaKey)&&(e.preventDefault(),e.shiftKey?this.state.history.ifSome((function(e){e.canRedo()&&(e.redo(),t.forceUpdate())})):this.state.history.ifSome((function(e){e.canUndo()&&(e.undo(),t.forceUpdate())})))}},{key:"render",value:function(){var e=this;return o.a.createElement(o.a.Fragment,null,o.a.createElement("header",null,o.a.createElement("h1",null,"Flood fill")),o.a.createElement("main",null,o.a.createElement("div",null,this.state.fileName.match({none:function(){return o.a.createElement("label",null,"Upload an image"," ",o.a.createElement("input",{type:"file",accept:"image/png, image/jpg, image/jpeg, image/gif",onChange:e.onFileChange}))},some:function(e){return o.a.createElement("p",null,"Successfully uploaded ",e)}})),this.state.replacementColor.match({none:function(){return null},some:function(t){return o.a.createElement("div",null,o.a.createElement("label",null,"Replacement color:",o.a.createElement(p.SketchPicker,{color:t,onChangeComplete:e.onReplacementColorChangeComplete})),o.a.createElement("section",null,o.a.createElement("h3",null,"Backdrop"),o.a.createElement("label",null,"Use checkerboard:"," ",o.a.createElement("input",{type:"checkbox",checked:e.state.shouldBackdropBeCheckered,onChange:e.onShouldBackdropBeCheckeredChange}),!e.state.shouldBackdropBeCheckered&&o.a.createElement("label",null,"Color:",o.a.createElement(p.SketchPicker,{disableAlpha:!0,color:e.state.backdropColorHex,onChangeComplete:e.onBackdropColorChangeComplete})))),o.a.createElement("label",null,"Tolerance:"," ",o.a.createElement("input",{type:"number",value:e.state.toleranceStr,onChange:e.onToleranceChange})),o.a.createElement("label",null,"Compare alpha values:"," ",o.a.createElement("input",{type:"checkbox",checked:e.state.shouldCompareAlpha,onChange:e.onShouldCompareAlphaChange})))}}),this.state.history.andThen((function(e){return e.current()})).match({none:function(){return null},some:function(t){return o.a.createElement("div",Object.assign({className:"MainCanvasContainer"+(e.state.shouldBackdropBeCheckered?" Checkerboard":"")},e.state.shouldBackdropBeCheckered?{}:{style:{backgroundColor:e.state.backdropColorHex}}),o.a.createElement(C,{imgData:t,canvasRef:e.mainCanvasRef,className:"MainCanvas",onClick:e.onCanvasClick}))}}),this.state.history.match({none:function(){return null},some:function(t){return o.a.createElement("div",null,o.a.createElement("h3",null,"History"),o.a.createElement("div",null,o.a.createElement("h4",null,"Past"),o.a.createElement("button",{onClick:e.onUndoClick,disabled:!t.canUndo()},"Undo"),o.a.createElement("div",null,t.past().map((function(e,t,n){var a=n.length;return o.a.createElement(C,{key:t,imgData:e,className:"HistorySnapshot"+(t<a-1?" NonFinalSnapshot":"")})})))),o.a.createElement("div",null,o.a.createElement("h4",null,"Future"),o.a.createElement("button",{onClick:e.onRedoClick,disabled:!t.canRedo()},"Redo"),o.a.createElement("div",null,t.future().map((function(e,t,n){var a=n.length;return o.a.createElement(C,{key:t,imgData:e,className:"HistorySnapshot"+(t<a-1?" NonFinalSnapshot":"")})})))))}})))}},{key:"onFileChange",value:function(e){var t=this,n=e.target.files;if(null!==n){var a=n[0];a instanceof File&&/\.(jpe?g|png|gif)$/i.test(a.name)&&b(a).then((function(e){var n=function(e){var t=document.createElement("canvas");t.width=e.width,t.height=e.height;var n=t.getContext("2d");return n.drawImage(e,0,0),n.getImageData(0,0,t.width,t.height)}(e);t.setState({originalImg:f.a.some(e),fileName:f.a.some(a.name),history:f.a.some(y.fromCurrent(n)),replacementColor:f.a.some({r:0,g:0,b:0,a:0})})}))}}},{key:"onReplacementColorChangeComplete",value:function(e){this.setState({replacementColor:f.a.some(e.rgb)})}},{key:"onCanvasClick",value:function(e){var t=this;f.a.all([this.state.replacementColor,this.state.history,this.state.history.andThen((function(e){return e.current()}))]).ifSome((function(n){var a=Object(c.a)(n,3),o=a[0],r=a[1],i=a[2],l=e.clientX,u=e.clientY,h=i,s=t.mainCanvasRef.current.getBoundingClientRect(),d={x:Math.round(l-s.left),y:Math.round(u-s.top)};if(m=h,f=d,!O(E(o),S(m,f))){var m,f,p=w(h,d,o,{tolerance:parseInt(t.state.toleranceStr,10),shouldCompareAlpha:t.state.shouldCompareAlpha});r.push(p),t.forceUpdate()}}))}},{key:"onToleranceChange",value:function(e){this.setState({toleranceStr:e.target.value})}},{key:"onShouldCompareAlphaChange",value:function(e){this.setState({shouldCompareAlpha:e.target.checked})}},{key:"onUndoClick",value:function(){this.state.history.expect("Cannot call onUndoClick if history is none").undo(),this.forceUpdate()}},{key:"onRedoClick",value:function(){this.state.history.expect("Cannot call onRedoClick if history is none").redo(),this.forceUpdate()}},{key:"onBackdropColorChangeComplete",value:function(e){this.setState({backdropColorHex:e.hex})}},{key:"onShouldBackdropBeCheckeredChange",value:function(e){this.setState({shouldBackdropBeCheckered:e.target.checked})}}]),t}(o.a.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(o.a.createElement(I,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))},93:function(e,t,n){e.exports=n(265)},98:function(e,t,n){}},[[93,1,2]]]);
//# sourceMappingURL=main.b984d7e7.chunk.js.map