## uniapp小程序持久化工具

### 使用方法

可以选择创建一个需要持久化的vuex模块persistent.js:

    import {persistedState} from 'uniapp-persistent'
    
    const state = {
    	loginID: ''
    }
    
    const mutations = {
    	// mutations
    }
    export default {
    	namespaced: true,
    	state,
    	mutations
    }
    
    /*
    以下是对于持久化参数的处理，当此文件state中的值改变时，自动更新对应项的持久化存储
     */
    persistedState({
		state, 
		setItem: uni.setStorageSync, 
		getItem: uni.getStorageSync, 
		setDelay: 200 //state改变之后的200ms对state进行持久化，用于防抖
	})

在store中对此模块进行引用

    import Vue from 'vue'
    import Vuex from 'vuex'
    import storage from './persistent.js' // 持久化的模块
    import {state, mutations} from './store.js' // 不需要持久化的vuex
    
    Vue.use(Vuex)
    export default new Vuex.Store({
    	state,
    	mutations,
    	modules:{
    		storage
    	}
    })
