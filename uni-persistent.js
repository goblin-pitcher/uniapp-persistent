/*
 持久化相关内容
 */
// 重写的Array方法
const funcArr = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']
const typeArr = ['object', 'array']
// 各级指向父节点和及父节点名字的项
const pointerParent = Symbol('parent')
const poniterKey = Symbol('key')

function setCallBack(obj, key, options) {
	if (options && options.set) {
		if (getType(options.set) !== 'function') throw ('options.set需为function')
		options.set(obj, key)
	}
}

function rewriteArrFunc(arr, options) {
	if (getType(arr) !== 'array') throw ('参数需为array')
	funcArr.forEach(key => {
		arr[key] = function(...args) {
			this.__proto__[key].apply(this, args)
			setCallBack(this[pointerParent], this[poniterKey], options)
		}
	})
}

function dep(obj, key, options) {
	let data = obj[key]
	if (typeArr.includes(getType(data))) {
		data[pointerParent] = obj
		data[poniterKey] = key
	}
	Object.defineProperty(obj, key, {
		configurable: true,
		get() {
			return data
		},
		set(val) {
			if (val === data) return
			data = val
			let index = typeArr.indexOf(getType(data))
			if (index >= 0) {
				data[pointerParent] = obj
				data[poniterKey] = key
				if (index) {
					rewriteArrFunc(data, options)
				} else {
					observer(data, options)
				}
			}
			setCallBack(obj, key, options)
		}
	})
}

function observer(obj, options) {
	if (getType(obj) !== 'object') throw ('参数需为object')
	let index
	Object.keys(obj).forEach(key => {
		dep(obj, key, options)
		index = typeArr.indexOf(getType(obj[key]))
		if (index < 0) return
		if (index) {
			rewriteArrFunc(obj[key], options)
		} else {
			observer(obj[key], options)
		}
	})
}

function getStoragePath(obj, key) {
	let storagePath = [key]
	while (obj) {
		if (obj[poniterKey]) {
			key = obj[poniterKey]
			storagePath.unshift(key)
		}
		obj = obj[pointerParent]
	}
	return storagePath
}

function debounceStorage(state, fn, delay) {
	if(getType(fn) !== 'function') return null
	let updateItems = new Set()
	let timer = null
	return function setToStorage(obj, key) {
		let changeKey = getStoragePath(obj, key)[0]
		updateItems.add(changeKey)
		clearTimeout(timer)
		timer = setTimeout(() => {
			try {
				updateItems.forEach(key => {
					fn.call(this, key, state[key])
				})
				updateItems.clear()
			} catch(e) {
				console.error(`persistent.js中state内容持久化失败,错误位于[${changeKey}]参数中的[${key}]项`)
			}
		}, delay)
	}
}
export function persistedState({state, setItem, getItem, setDelay=0}) {
    if(getType(getItem) === 'function') {
        // 初始化时将storage中的内容填充到state
        try{
            Object.keys(state).forEach(key => {
                if(state[key] !== undefined) 
                    state[key] = getItem(key)
            })
        } catch(e) {
            console.error('初始化过程中获取持久化参数失败')
        }
    } else {
        console.warn('getItem不是一个function,初始化时获取持久化内容的功能不可用')
    }
    observer(state, {
        set: debounceStorage(state, setItem, setDelay)
    })
}

/*
 通用方法
 */
function getType(para) {
	return Object.prototype.toString.call(para)
		.replace(/\[object (.+?)\]/, '$1').toLowerCase()
}
