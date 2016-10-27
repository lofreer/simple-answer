(function(){
	// 判断是否移动端
	var isMobile = /Mobile/.test(navigator.userAgent);
	//ios终端
	var isIOS = /(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent); 
	// 题目序列
	var marks = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    /****************** 虚拟DOM创建 start ******************/
	function El(tagName,props,children,handles) {
		if (!(this.tagName = tagName)) return;
		var param, child;

		if (!handles) {
			if (utils.isObject(param = arguments[1]) && !utils.isFunction(param.click)) {
				this.props = param;
			} else if (utils.isArray(param)) {
				this.children = param;
			}  else {
				this.handles = param;
			}
			if (utils.isArray(child = arguments[2])) {
				this.children = child;
			} else {
				this.handles = child;
			}
		} else {
			this.props = props;
			this.children = children;
			this.handles = handles;
		}		
	}
	El.prototype = {
		render: function() {
			var self = this;
			var el = document.createElement(this.tagName),
				props = this.props || {},
				children = this.children || [],
				handles = this.handles || {};
			for (var prop in props) {
				if (props[prop]) {
					el.setAttribute(prop,props[prop]);
				}			
			}

			for (var handle in handles) {
				el.addEventListener(handle,handles[handle],false);
			}

			children.forEach(function(child){
				if (utils.isArray(child)) {
					child.forEach(function(item){
						item && (item instanceof HTMLElement ? el.appendChild(item) : el.insertAdjacentHTML('beforeend', item));
					})
				} else {
					child && (child instanceof HTMLElement ? el.appendChild(child) : el.insertAdjacentHTML('beforeend', child));
				}
			});
			return el;		
		}
	};
	function cel(tagName,props,children,handles) {
		return new El(tagName,props,children,handles).render();
	}
	/****************** 虚拟DOM创建 end ******************/
	
	/****************** 常用工具集合 start ******************/
	var utils = {
		each: function(obj, iterator, context) {
			if (obj == null) return;
	        if (obj.length === +obj.length) {
	            for (var i = 0, l = obj.length; i < l; i++) {
	                if(iterator.call(context, obj[i], i, obj) === false)
	                    return false;
	            }
	        } else {
	            for (var key in obj) {
	                if (obj.hasOwnProperty(key)) {
	                    if(iterator.call(context, obj[key], key, obj) === false)
	                        return false;
	                }
	            }
	        }
		},
		map: function(obj, iterator, context) {
			if (obj == null) return;
			var result = [];
	        if (obj.length === +obj.length) {
	            for (var i = 0, l = obj.length; i < l; i++) {
	                result.push(iterator.call(context, obj[i], i, obj));
	            }
	        } else {
	            for (var key in obj) {
	                if (obj.hasOwnProperty(key)) {
	                    result.push(iterator.call(context, obj[key], key, obj));
	                }
	            }
	        }
	        return result;
		},
		extend: function(prop) {
			Array.prototype.slice.call(arguments, 1).forEach(function(source){
				for (var key in source) {
					if (source[key] != null) prop[key] = source[key];
				}
			});
			return prop;
		},
		// 浮点数截取：存在浮点数的情况下只保留一位小数，可加参数设置噢〜
		floatCut: function(num){
			var index = (num+'').indexOf('.');
			if (index !== -1) {
				return num.toFixed(1);
			}
			return num;
		}
	};
    // 类型判断方法
	['String', 'Function', 'Array', 'Number', 'RegExp', 'Object', 'Date'].forEach(function(v){
		utils['is' + v] = function(obj) {
		    return {}.toString.call(obj) === "[object " + v + "]";
		}
	});	
	/****************** 常用工具集合 end ******************/

	var Events = {
		// DOM 事件绑定
		bind: function(element, type, selector, handler, capture) {
			capture = !!capture;
			var types = utils.isArray(type) ? type : type.trim().split(/\s+/),
				length = types.length;
			if (length) {
				if (utils.isString(selector)) {		
					while (length--) {
						element.addEventListener(types[length], function(e){	
							utils.each(this.querySelectorAll(selector), function(item){
								(e.target === item || item.contains(e.target)) && handler.call(item,e);
							})
						}, capture);
					}
				} else {
					handler = !!handler;
					while (length--) {
						element.addEventListener(types[length], selector, handler);
					}
				}
			}
			element = null;            
		},
		// DOM 事件触发
		trigger: function(element, type) {
			var event = document.createEvent('HTMLEvents');
			event.initEvent(type, true, false);
			element.dispatchEvent(event);
		},
		// 触屏点击事件包裹
		touchClick: function(clickHandler, isPreventDefult) {
			var startX, startY;
			var events =  {
				touchstart: function(ev) {
					isPreventDefult && ev.preventDefault();
					startX = ev.touches[0].clientX;
					startY = ev.touches[0].clientY;
				},
				touchend: function(ev) {
					var endX = ev.changedTouches[0].clientX,
						endY = ev.changedTouches[0].clientY,
						distanceX = startX - endX,
						distanceY = startY - endY;
					if (Math.abs(distanceX) < 5 && Math.abs(distanceY) < 5) {
						clickHandler.call(this,ev);
					}
				}
			}
			if (!isMobile) {
				events.click = function(ev) {
					clickHandler.call(this,ev);
				}
			}
			return events;
		}	

	}


	// 默认配置
	var config = {
		wrap: 'body',
		index: 0,
		length: 0,
		time: 0
	}

	// 构造函数
	function Answer(options) {

		if (!options.topics) return;
		utils.extend(this, config, options);	
		if (utils.isString(this.wrap)) this.wrap = document.querySelector(this.wrap);
		// 如果是套卷则渲染套卷dom，否则直接显示题目
		if (this.paper) {
			this.paperRender(this.paper);
			this.wrap.ownerDocument.title = this.paper.title;
		} else {
			this.wrap.classList.add('show'); 
		}
		this.length = this.topics.length;
		this.answers = [];
		this.topics.forEach(function(item){
			item.rightAnswers = [];
			item.answers.forEach(function(answer, i){
				if (answer.isRight) item.rightAnswers.push(marks[i]);
			});
		});
		console.log(this);
		this.render(this.topics);
		
	}
	// 异步请求封装
	Answer.ajax = function (url, type, data, success, error) {
        if (!url) return;
        type = type.toUpperCase();

		var str = [];
		for (var key in data) {
			if (typeof data[key] === 'function') continue;
			str.push(encodeURIComponent(key)+"="+encodeURIComponent(data[key]));
		}

        var request = new XMLHttpRequest();
        request.open(type, url, true);

        request.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                success && success(JSON.parse(this.response));
            } else {
                error && error(this.response);
            }
        };

        request.onerror = function () { error(this.response) };

        type === 'POST' && request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        type === 'POST' ? request.send(str.join('&')) : request.send();
    };
	// url参数解析
	Answer.urlParse = function(name,query) {
		var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"),r;
		if(query){
			r = query.match(reg);
		}else{
			r = window.location.search.substr(1).match(reg);
		}
		if(r!=null)return unescape(r[2]); return null;
	};
	// 实例方法
	Answer.prototype = {
		// 初始化渲染
		render: function(data) {
			var self = this;
			self.isLoading = false;
			// 题目固定标题
			var topicHeader = self.topicHeader = cel('div',{class:'topic-title'},[
				self.paper ? cel('span',{class:'index'},[data[0].index+1+'. ']) : null,
				cel('span',{class:'type'},[data[0].answerTypeText]),
				cel('div',{class:'right'},[
					cel('span',{class:'count'}),
					cel('span',{class:'score'},['（'+ data[0].defaultScore +'分）'])
				])
			]);
			// 题目列表
			var topicList = self.topicList = cel('ul',{class:'topic-list'},data.slice(0, 3).map(function(item){
				return self.topic(item);
			}), self.touchs());
			var topicMain = self.topicMain = cel('div',{class:'topic-main'},[topicList]);
			// 套卷包含 操作按钮组 和 答题卡
			if (self.paper) {
				// 操作按钮
				var handlers = self.handlers = cel('div',{class:'topic-handlers'},[
					cel('span',{class:'prev btn disabled'},[
						cel('span',{class:'icon'}),
						'上一题'
					],self.touchClick(function(ev){ 
						self.run.call(self,true) 
					},true)),
					cel('span',{class:'card btn'},[
						cel('span',{class:'icon'}),
						'题卡'
					],self.touchClick(function(ev){ 
						self.cardShow(true)
					},true)),
					cel('span',{class:'submit btn'},[
						cel('span',{class:'icon'}),
						'交卷'
					],self.touchClick(function(ev){
						if (self.length > self.answers.length) {
							self.dialog();
						} else {
							self.submit();
						}
						
					},true)),
					cel('span',{class:'next btn'},[
						cel('span',{class:'icon'}),
						'下一题'
					],self.touchClick(function(ev){ 
						self.run.call(self) 
					},true))
				]);
				// 答题卡
				var cards = self.cards = cel('div',{class:'topic-card'},[
					cel('div',{class:'card-main'},[
						cel('div',{class:'card-title'},[
							cel('span',{class:'icon'}),
							'答题卡'
						]),
						cel('ul',{class:'card-list'}, data.map(function(item){
							return self.card(item);
						}))
					]),
					cel('div',{class:'card-hide'},[
						cel('span',{class:'icon'})
					],self.touchClick(function(ev){
						self.cardShow(false)
					}))
				]);
				self.wrap.appendChild(topicHeader)
				.parentNode.appendChild(topicMain)
				.parentNode.appendChild(handlers)
				.parentNode.appendChild(cards);
			} else {
				self.wrap.appendChild(topicHeader)
				.parentNode.appendChild(topicMain);				
			}
			// 材料题渲染
			self.materialListen();
			// 公共header渲染
			self.setHeader();
			// 答卷计时开始
			self.timeStart = new Date().getTime();
			// 图片点击事件
			self.bind(self.wrap, 'click', 'img:not(.kfformula)', function(ev){
				self.imgZoom.call(self, this.getAttribute('src'));
			});
		},
		// 组卷信息渲染
		paperRender: function(data) {
			var self = this;
			var paper = cel('div',{class:'paper-wrapper'},[
				cel('div',{class:'paper-main'},[
					cel('h1',{class:'title'},[data.title]),
					cel('p',{class:'info'},[
						cel('div',{class:'score'},[
							'总分:',
							cel('span',{class:'val'},[data.score+'分'])
						]),
						cel('div',{class:'difficulty'},[
							'难度:',
							(function(length){
								var arr = [];
								for (var i = 0; i < 5; i++) {
									arr.push(i+'');
								}
								return arr.map(function(item, index){
									return index < length ? cel('span',{class:'val'}) : cel('span',{class:'val empty'});
								})
							})(data.difficulty)							
						])
					]),
					cel('p',{class:'describe'},[data.description]),
					cel('div',{class:'topic-start'},['开始答卷'],self.touchClick(function(ev){ 
						ev.preventDefault();
						self.wrap.classList.add('show'); 
					}))
				])
			]);
			this.wrap.parentNode.insertBefore(paper, this.wrap);
		},
		// 材料题监听
		materialListen: function(back,show) {
			var self = this,
				data = self.topics[self.index],
				material = data.material,
				audio = data.audioPath,
				video = data.videoPath;
			if (!material) {
				self.material && self.wrap.removeChild(self.material), self.material = null;
				self.topicHeader.querySelector('.count').innerHTML = '';
				return;
			};
			if (!show) {
				show = back ? self.topics[self.index].itemIndex === self.topics[self.index].itemLength : 
				self.topics[self.index].itemIndex === 1;							
			} 
			if (show) {				
				self.material && self.wrap.removeChild(self.material);
				self.material = cel('div',{class:'common-material'},[					
					audio ? cel('AUDIO',{class:'topic-audio', src:data.audioPath, controls:true}) : cel('div',{class:'topic-material'},[material])
				]);
				self.wrap.insertBefore(self.material, self.topicMain);
			}
		},
		// 题目构建
		topic: function(data) {
			var self = this;
			var description, answerlist, submitBtn, topicTitle;
			// 材料题包含 子title
			if (data.material) {
				var cardId = self.paper ? data.cardId : data.cardId.split('-')[1];
				topicTitle = self.topicTitle = cel('div',{class:'topic-title',style:'border-bottom: none;'},[
					cel('span',{class:'type'},[data.typeText]),
					cel('span',{class:'index'},['（'+ cardId +'）']),
					cel('div',{class:'right'},[
						cel('span',{class:'score'},['（'+ data.score +'分）'])
					])
				]);
			}
			// 题干信息
			data.description && (description = cel('div',{class: 'topic-describe'},[data.description]));
			// 答案列表
			answerlist = cel('ol',{class:'answer-list'},data.answers.map(function(item, index){				
				var answer = self.answers[data.index] || [],
					key = index,
					classList = 'answer-item';
				if (answer.indexOf(key) > -1) classList+= ' active';
				if (data.isParse) classList+= ' disabled';
				return cel('li',{class: classList, 'data-answer': key+''},[
						cel('span',{class: data.type !== 1 ? 'mark radio' : 'mark checkbox'},[marks[index]]),
						cel('p',{class:'answer-text'},[item.description.replace(/\n/g, '</br>')])
					],self.touchClick(function(ev){
						if (this.classList.contains('disabled')) return;
						ev.preventDefault();
						data.type !== 1 ? self.single.call(this,ev,self) : self.multi.call(this,ev,self);
						if (!self.paper) {
							if (self.answers[data.index] && self.answers[data.index].length > 0) {
								submitBtn.classList.remove('disabled');
							} else {
								submitBtn.classList.add('disabled');
							}
						}
				}));
			}));
			if (self.paper) {
				return cel('li',{class: 'topic-item'},[topicTitle, description, answerlist]);
			}			
			if (data.isParse) {
				return cel('li',{class: 'topic-item'},[topicTitle, description, answerlist, self.parse(data)]);
			}
			// 非组卷和题目已解析的情况下不渲染提交按钮：题目已作答并解析的情况
			var result= self.answers[data.index];
			var disabled = (result && result.length > 0) ? '' : 'disabled';
			submitBtn = cel('div',{class:'submit-btn ' + disabled},[' 提交并查看答案'], self.touchClick(function(ev){
				if (this.classList.contains('disabled')) return;
				self.topics[data.index].isParse = true;
				Array.prototype.slice.call(this.previousSibling.querySelectorAll('.answer-item')).forEach(function(item){
					item.classList.add('disabled');
				})
				self.parse(data,submitBtn.parentNode);
				submitBtn.parentNode.removeChild(submitBtn);
			}));
			return cel('li',{class: 'topic-item'},[topicTitle, description, answerlist, submitBtn]);
			
		},
		// 题目解析
		parse: function(data,el) {
			var self = this;
			var userAnswer = self.answers[data.index].map(function(item){
				return item;
			}).sort().toString();
			var rightAnswer = data.rightAnswers.sort().toString();
			var isOK = userAnswer === rightAnswer;

			var key, reference, count, parsing, material;	
			// 正确情况		
			key = cel('div',{class:'parse-key '+ (isOK ? '' : 'error') },[
				cel('div',{class:'img-box'}),
				cel('div',{class:'text'},[
					cel('p',{class:'title'},[
						cel('span',{class:'color'},[
							data.type === 3 ? '你的回答' : (isOK ? '回答正确' : '回答错误')
						]),
						cel('span',['（难易度：'+ {1:'容易',2:'较易',3:'一般',4:'较难',5:'困难'}[data.difficulty] +'）'])
					]),
					cel('p',{class:'text'},[
						data.type === 3 ? (isOK ? '会做' : '不会做') : ('正确答案是'+rightAnswer + (!isOK ? '，你的答案是'+userAnswer : '')) 
					])
				])
			]);
			// 参考答案
			reference = cel('div',{class:'parse-reference'},[
				cel('p',{class:'title'},[
					cel('span',{class:'icon'}),
					'答案'
				]),
				cel('p',{class:'text'},[data.reference])
			]);
			// 统计信息
			count = cel('div',{class:'parse-count'},[
				cel('p',{class:'title'},[
					cel('span',{class:'icon'}),
					'统计'
				]),
				cel('p',{class:'text'},[
					'全站数据：本题共被作答'+ data.evCounts +'次，正确率为'+ (data.rightRate || 0) +'%'
				])
			]);
			// 题目解析
			if (data.videoPath) {
				var parseVideo = cel('div',{class:'parse-video'});
				var player = new Clappr.Player({
					source: data.videoPath, 
					autoPlay: false,
					width: '100%', 
					height: 200
				});
				player.attachTo(parseVideo);
			}
			
			parsing = cel('div',{class:'parse-parsing'},[
				cel('p',{class:'title'},[
					cel('span',{class:'icon'}),
					'解析'
				]),
				cel('div',{class:'text'},[
					cel('p',[data.solveGuide]),
					data.videoPath ? parseVideo : null
				])
			]);			
			
			// 材料题原文
			material = cel('div',{class:'parse-material'},[
				cel('p',{class:'title'},[
					cel('span',{class:'icon'}),
					'材料原文'
				]),
				cel('p',{class:'text'},[data.material])
			]);
			if (el) {
				// 材料题包含 材料原文
				if (data.material) {
					el.appendChild(cel('div',{class:'topic-parse'},[key,data.type === 3 ? reference : null,count,parsing,material]));
				// 综合题包含 参考答案
				} else if (data.type === 3) {
					el.appendChild(cel('div',{class:'topic-parse'},[key,reference,count,parsing]));				
				} else {
					el.appendChild(cel('div',{class:'topic-parse'},[key,count,parsing]));
				}
			} else {
				if (data.material) {
					return cel('div',{class:'topic-parse'},[key,data.type === 3 ? reference : null,count,parsing,material]);
				} else if (data.type === 3) {
					return cel('div',{class:'topic-parse'},[key,reference,count,parsing]);
				} else {
					return cel('div',{class:'topic-parse'},[key,count,parsing]);
				}
			}			
		},
		// 答题卡构建
		card: function(data) {
			var self = this;
			return cel('li',{class:'card-item','data-index':data.index+''},[data.cardId],self.touchClick(function(ev){self.topicJump.call(this, ev, self)}))
		},
		// 设置答题卡状态
		setAnswerCard: function(isActive) {
			this.cards.querySelectorAll('.card-item')[this.index].classList[ isActive ? 'add' : 'remove' ]('active');			
		},
		// 单选操作
		single: function(ev,self) {
			var answer = parseInt(this.getAttribute('data-answer'));
			if (this.classList.contains('active')) return;
			var list = this.parentNode.querySelectorAll('li');
			Array.prototype.slice.call(list).forEach(function(item){
				item.classList.remove('active');
			});			
			self.answers[self.index] = [marks[answer]];
			this.classList.add('active');
			if (self.paper) {
				self.setAnswerCard(true);
				setTimeout(function(){
					self.run();
				}, 200);
			}			
		},
		// 多选操作
		multi: function(ev,self) {
			var select = self.answers[self.index] || [],
				answer = parseInt(this.getAttribute('data-answer')),
				index = select.indexOf(marks[answer]);
			self.answers[self.index] = select;
			index > -1 ? select.splice(index, 1) : select.push(marks[answer]);
			this.classList[this.classList.contains('active') ? 'remove' : 'add']('active');
			if (self.paper) {
				self.setAnswerCard(select.length ? true : false);
			}
		},
		// 创建题目dom：预加载和答题卡跳转时用 
		create: function(start, length) {
			var self = this;
			var topics = self.topics.slice(start,start+length);
			if (topics.length > 1) {
				return topics.map(function(item){
					return self.topic(item);
				});
			} else {
				return self.topic(topics[0]);
			}
			
		},
		// 获取题目列表过渡效果
		getTransform: function(el) {
            var reg = /\((.*?)\)/,
                result = {};
            result.x = parseInt((getComputedStyle(el)['transform'] || getComputedStyle(el)['-webkit-transform']).match(reg)[1].split(',')[4]);
            result.y = parseInt((getComputedStyle(el)['transform'] || getComputedStyle(el)['-webkit-transform']).match(reg)[1].split(',')[5]);
            return result;
        },
		// 设置题目列表移动位置
        setTransform: function(el, val) {
            var css = 'translate3d('+ val.x +'px, '+ val.y +'px, 0)',
                style = el.style;
            style.transform = css;
        },
		// 设置题目列表过渡效果
        setTransition: function(el, val) {
            var style = el.style;
            style.transition = val;
        },
		// 题目列表触屏事件
		touchs: function() {
			var self = this;
			var minX = window.innerWidth / 4,
				length = self.length - 1,
				startX, startY, direction, has, height, currentTopic, scrollTop;
			var isDown = false;
			var events = {
				touchstart: function(ev) {
					startX = isMobile ? ev.touches[0].clientX : ev.clientX;
					startY = isMobile ? ev.touches[0].clientY : ev.clientY;
					self.paper && self.cardShow(false);
					isDown = true;
					var topics = Array.prototype.slice.call(self.topicList.querySelectorAll('.topic-item'));
					topics.forEach(function(item){
						if (item.contains(isMobile ? ev.touches[0].target : ev.target)) {
							currentTopic = item;
							scrollTop = currentTopic.scrollTop;
							return;
						}
					});
					height = currentTopic.offsetHeight;
				},
				touchmove: function(ev) {
					// 判断鼠标是否已经按下
					if (!isMobile && !isDown) return;
					var scroll,
						currentX = isMobile ? ev.touches[0].clientX : ev.clientX,
						currentY = isMobile ? ev.touches[0].clientY : ev.clientY,
						diffX = startX - currentX,
						diffY = startY - currentY,
						distanceX = startX - currentX,
						distanceY = startY - currentY,
						fix = self.index * this.offsetWidth;
					
					if (Math.abs(distanceX) >= Math.abs(distanceY)) {
						ev.preventDefault();
						self.direction = direction = diffX > 0 ? true : false;

						if (!direction && self.index === 0) {
							scroll = Math.abs(diffX);
						} else {
							scroll = direction ? -(Math.abs(diffX) + fix) : -(fix - Math.abs(diffX));
						}   
						
						self.setTransition(this, 'transform 0ms');
						self.setTransform(this, {x: scroll, y: 0});
					} 
					else {
						// 禁止页面上下拖动
						if (currentTopic.scrollHeight <= height || currentTopic.scrollTop === currentTopic.scrollHeight - height) {	
							if (diffY > 0 || currentTopic.scrollTop <= 0) {
								ev.preventDefault();
							}
						}
					}
				},
				touchend: function(ev) {
					var endX = isMobile ? ev.changedTouches[0].clientX : ev.clientX,
						endY = isMobile ? ev.changedTouches[0].clientY : ev.clientY,
						distanceX = startX - endX,
						distanceY = startY - endY;
					has = Math.abs(startX - endX) > minX;
					if (Math.abs(distanceX) >= Math.abs(distanceY)) {
						if (has) {
							direction ? self.index++ : self.index--;
						}
						if (self.index < 0) self.index = 0;
						if (self.index > length) self.index = length;

						var scroll = -(self.index * this.offsetWidth);
						self.setTransition(this, 'transform 300ms ease-out');
						self.setTransform(this, {x: scroll, y: 0});	
						if (self.paper) {
							if (self.index === 0) {
								self.handlers.querySelector('.prev').classList.add('disabled');
							} else if (self.index === length) {
								self.handlers.querySelector('.next').classList.add('disabled');
							} else {
								self.handlers.querySelector('.prev').classList.remove('disabled');
								self.handlers.querySelector('.next').classList.remove('disabled');
							}	
						}		
						if (has) {
							self.setHeader();
							self.materialListen(!direction);	
							self.preload(self.direction);
						}
						isDown = false;	
					} 					
				}
			}
			// 同时绑定鼠标事件，暂不处理无影响的报错情况
			events.mousedown = events.touchstart;
			events.mousemove = events.touchmove;
			events.mouseup = events.touchend;
			return events;
		},
		// 答题卡显示／隐藏
		cardShow: function(show) {
			if (show) {
				this.cards.classList.add('topic-card-show');
			} else {
				this.cards.classList.remove('topic-card-show');
			}
		},
		// 设置题目标题
		setHeader: function() {
			var self = this;
			var anwerType, isMaterial;
			isMaterial = self.topics[self.index].material;
			// 材料题的公共header不太一样
			if (isMaterial) {
				anwerType = '材料题';
				self.topicHeader.querySelector('.count').innerHTML = '共'+ self.topics[self.index].itemCount +'题';
			} else {
				anwerType = self.topics[self.index].typeText;
			}
			var index = self.topics[self.index].cardId.split('-')[0];
			self.paper && (self.topicHeader.querySelector('.index').innerHTML = index + '. ');
			self.topicHeader.querySelector('.type').innerHTML = anwerType;
			self.topicHeader.querySelector('.score').innerHTML = '（'+ self.topics[self.index].itemScoreCount +'分）';
		},
		// 上一题 ／ 下一题
		run: function(back) {
			var self = this;
			if (self.isLoading) return;
			self.isLoading = true;
			if (back && self.handlers.querySelector('.prev').classList.contains('disabled')) return self.isLoading = false;
			if (!back && self.handlers.querySelector('.next').classList.contains('disabled')) return self.isLoading = false; 
			var length, scroll, isShowCard;
			length = self.length - 1;
			// isShowCard = self.index === length;
			if (back) {
				self.index--;
				self.direction = false;
			} else {
				self.index++;
				self.direction = true;
			}
			if (self.index < 0) self.index = 0;
			if (self.index > length) self.index = length;
			scroll = -(self.index * self.topicList.offsetWidth);

			// if (isShowCard) return self.cardShow(true);
			if (self.index === 0) {
				self.handlers.querySelector('.prev').classList.add('disabled');
			} else if (self.index === length) {
				self.handlers.querySelector('.next').classList.add('disabled');
			} else {
				self.handlers.querySelector('.prev').classList.remove('disabled');
				self.handlers.querySelector('.next').classList.remove('disabled');
			}

			self.setHeader();
			self.setTransition(self.topicList, 'transform 300ms ease-out');
			self.setTransform(self.topicList, {x: scroll, y: 0});
			self.materialListen(back);
			self.preload();
		},
		// 题目预加载
		preload: function() {			
			var self = this,
				list = this.topicList,
				maxLength = this.length - 1,
				index = self.direction ? (this.index + 1) : (this.index - 1);
			if (index < 0 || index > maxLength) return self.isLoading = false;
			if (self.direction && this.index === 1) return self.isLoading = false;
			if (!self.direction && this.index === maxLength - 1) return self.isLoading = false;

			var html = this.create(index, 1);
			if (self.direction) {
				list.removeChild(list.firstChild);
				list.appendChild(html);
			} else {
				list.removeChild(list.lastChild);
				list.insertBefore(html, list.firstChild);
			}
			var diff = (self.index - 1) * self.topicList.offsetWidth;
			if (self.index === 0) diff = 0;
			if (self.index === self.length - 1) diff = diff - self.topicList.offsetWidth;
			self.topicList.style.left = diff < 0 ? 0 : diff + 'px';
			self.isLoading = false;
		},
		// 答题卡跳转
		topicJump: function(ev,self) {
			ev.preventDefault();
			var dataLength = self.length;
			var topicList, scroll, left,
				length = dataLength < 3 ? dataLength : 3,
				defaultIndex = parseInt(this.getAttribute('data-index'),10)+1,
				index = defaultIndex,
				list = self.topicList,
				wdith = list.offsetWidth;
			if (dataLength <= 3) {
				index = 0;
			} else {
				index = index - 2;
				if (index < 1 || dataLength === 1) index = 0;
				if (index >= dataLength-2) index = (dataLength-1) - 2;
			}
			topicList = self.create(index, length);
			
			self.index = defaultIndex - 1;
			left  = (self.index - 1) * wdith;
			scroll = -(self.index * wdith);
			if (self.index === 0) {
				left = 0;
				self.handlers.querySelector('.prev').classList.add('disabled');
				dataLength > 2 && self.handlers.querySelector('.next').classList.remove('disabled');
			} else if (self.index === dataLength - 1) {
				left = left - wdith;
				self.handlers.querySelector('.next').classList.add('disabled');
				dataLength > 2 && self.handlers.querySelector('.prev').classList.remove('disabled');
			} else {
				self.handlers.querySelector('.prev').classList.remove('disabled');
				self.handlers.querySelector('.next').classList.remove('disabled');
			}

			self.cardShow(false);
			list.style.left = left + 'px';
			list.innerHTML = '';
			if (utils.isArray(topicList)) {
				topicList.forEach(function(item){
					list.appendChild(item);
				});
			} else {
				list.appendChild(topicList);
			}
			
			self.setTransition(list, 'transform 300ms ease-out');
			self.setTransform(list, {x: scroll, y: 0});
			self.setHeader();
			self.materialListen(false,true);
		},
		// 对话框
		dialog: function(options) {
			var self = this, html;
			var num = 0;
			self.answers.forEach(function(item){
				if (item) num++;
			});
			var config = {
				title: '温馨提示',
				content: '<h3>确定交卷吗？</h3><p>您还有'+ (self.length - num) +'道题没有作答</p>',
				btn: ['确定','取消'],
				confirm: function(ev){
					self.submit();
					html.parentNode.removeChild(html);
				},
				cancel: function(){
					html.parentNode.removeChild(html);
				}
			}			
			utils.extend(config, options);
			html = cel('div',{class:'answer-dialog-wrapper'},[
				cel('div',{class:'answer-dialog'},[
					cel('div',{class:'dialog-title'},[
						cel('p',{class:'text'},[config.title]),
						cel('span',{class:'dialog-close'},self.touchClick(function(ev){
							config.cancel.call(this,ev);
						}))
					]),
					cel('div',{class:'dialog-content'},[
						config.content
					]),
					cel('div',{class:'dialog-handlers'},config.btn.map(function(item,index){
						return cel('div',{class:'dialog-btn'},[item],self.touchClick(function(ev){
							if (index === 0) {
								config.confirm.call(this,ev);
							} else if (index === 1) {
								config.cancel.call(this,ev);
							}
						}))
					}))
				])
			]);
			document.body.appendChild(html);
		},
		// 时间统计
		timer: function() {
			var self = this,
				minute = 0,
				second = 0;
			var timing = function() {
				second++;
				if (second === 60) {
					second = 0;
					minute++;
				}
				self.time = minute*60 + second;
			}
			self.timing = setInterval(timing, 1000);
		},
		// 试卷提交
		submit: function() {
			var self = this;
			self.timeEnd = new Date().getTime();
			var result = [], 
				num = 0,
				score = 0;
			self.topics.forEach(function(item, index){
				result[index] = null;
			});
			self.answers.forEach(function(item,index){
				if (item.sort().toString() === self.topics[index].rightAnswers.sort().toString()) {
					num++;
					score += self.topics[index].score;
					result[index] = true;
				} else {
					result[index] = false;
				}
			});
			self.report({
				result: result,
				title: self.paper.title,
				totalScore: self.paper.score,
				score: score,
				itemTotalCount: self.topics.length,
				rightCount: num,
				androidDir: 'http://a.app.qq.com/o/simple.jsp?pkgname=com.yunti.zzm',
				iosDir: 'http://a.app.qq.com/o/simple.jsp?pkgname=com.yunti.zzm'
			});
		},
		// 答题报告
		report: function(data) {			
			var self = this;
			var time = self.timeEnd - self.timeStart,
				minute = Math.floor(time/1000/60%60),
				second = Math.floor(time/1000%60);
				if (minute < 10) minute = '0'+minute;
				if (second < 10) minute = '0'+second; 
			var header = cel('div',{class:'report-header'},[
				cel('div',{class:'header-top'},[
					cel('h3',{class:'header-title'},[data.title]),
					cel('div',{class:'report-time'},[
						'答卷用时:&nbsp;&nbsp;',
						minute + ':' + second
					]),
					cel('div',{class:'report-result'},[
						cel('div',{class:'report-score'},[
							cel('div',{class:'score'},[
								cel('p',{class:'report-result-title'},[
									'得分<small>（满分: '+ data.totalScore +'分）</small>'									
								]),
								cel('span',{class:'value'},[
									data.score + '<small>分</small>'
								])
							])
						]),
						cel('div',{class:'report-num'},[
							cel('div',{class:'num'},[
								cel('p',{class:'report-result-title'},[
									'答对<small>（共计: '+ data.itemTotalCount +'题）</small>'									
								]),
								cel('span',{class:'value'},[
									data.rightCount + '<small>题</small>'
								])
							])
						])
					])
				]),
				cel('div',{class:'report-compare'},[
					cel('div',[
						cel('span',[data.avCounts || '0']),
						cel('small',['全站平均分'])
					]),
					cel('div',[
						cel('span',[utils.floatCut(data.rightCount/data.itemTotalCount) + '%']),
						cel('small',['正确率'])
					]),
					cel('div',[
						cel('span',[data.rankDesc || '0']),
						cel('small',['击败考生数'])
					])
				])
			]);
			var main = cel('div',{class:'report-main'},[
				cel('div',{class:'main-title'},[
					cel('h3',{class:'main-title-text'},[
						cel('span',{class:'icon'}),
						'答题情况'
					])
				]),
				cel('ul',{class:'report-topic-list'},self.topics.map(function(item,index){
					var result = data.result[index],
						className = '';
					if (result === true) {
						className = 'answer-correct';
					} else {
						className = result === false ? 'answer-error' : 'answer-empty';
					}
					return cel('li',{class:'report-topic-item ' + className},[item.cardId]);
				}))
			]);
			var download = isIOS ? data.iosDir : data.androidDir;
			var footer = cel('div',{class:'report-footer'},[
				cel('a',{class:'app', href:download},['下载书链APP客户端']),
				cel('img',{src:'./assets/images/app-banner.png'})
			]);
			var html = cel('div',{class:'answer-report'},[header, main, footer]);
			document.body.appendChild(html);
			setTimeout(function(){
				html.classList.add('show');
				self.destroy();
			},1000/60);
		},
		// 销毁题目列表
		destroy: function() {
			this.wrap.innerHTML = '';
		},
		// 图片缩放
		imgZoom: function(src){
			var self = this;
			var img = cel('img',{'class': 'img-zoom','src': src}, (function(){
				var startX, startY, direction, xy, width, defaultWidth;
				var scaleXY = false;
				var isZoom = false;
				var events = {
					touchstart: function(ev) {
						ev.preventDefault();
						startX = isMobile ? ev.touches[0].clientX : ev.clientX;
						startY = isMobile ? ev.touches[0].clientY : ev.clientY;
						xy = self.getTransform(this);	
						width = this.offsetWidth;	
						if (!defaultWidth) defaultWidth = this.offsetWidth;				
					},
					touchmove: function(ev) {
						ev.preventDefault();
						if (ev.targetTouches.length == 2) {
							isZoom = true;
							var p1 = ev.touches[0],
								p2 = ev.touches[1];
							

							if (!scaleXY) {
								scaleXY = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2))/100;
							}	
							var currentScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2))/100; 
							var zoomScale = currentScale - scaleXY;

							self.setTransition(this, 'transform 0ms');
							if (zoomScale && width+width*zoomScale <=  this.naturalWidth && width+width*zoomScale >= defaultWidth) {
								this.style.width = width+width*zoomScale + 'px';
								self.setTransform(this, {x: xy.x + xy.x * zoomScale, y: xy.y + xy.y * zoomScale});
							}

						} else if (ev.targetTouches.length == 1) {
							if (isZoom) return;
							var currentX = isMobile ? ev.touches[0].clientX : ev.clientX,
								currentY = isMobile ? ev.touches[0].clientY : ev.clientY,
								diffX = startX - currentX,
								diffY = startY - currentY,
								distanceX = startX - currentX,
								distanceY = startY - currentY;
							
							self.setTransition(this, 'transform 0ms');
							direction = diffX > 0 ? true : false;
							diffX = direction ? -Math.abs(diffX) : Math.abs(diffX);
							direction = diffY > 0 ? true : false;
							diffY = direction ? -Math.abs(diffY) : Math.abs(diffY);
							self.setTransform(this, {x: xy.x+diffX, y: xy.y+diffY});  
						}						
					},
					touchend: function(ev) {
						if (ev.targetTouches.length === 0 && isZoom) {
							scaleXY = false;
							isZoom = false;
						}						
					}
				}
				return events;
			})());
			var imgFixed = cel('div',{'class':'img-zoom-fixed'},[img],self.touchClick(function(ev){
				if (ev.target !== img && !img.contains(ev.target)) {
					imgFixed.parentNode.removeChild(imgFixed);
				}
			},true));
			document.body.appendChild(imgFixed);
		}
	}
	utils.extend(Answer.prototype, Events);
	// 挂载异步请求方法，内部使用更方便
	Answer.prototype.ajax = Answer.ajax;
	// 挂载到全局
	window.Answer = Answer;
})();
