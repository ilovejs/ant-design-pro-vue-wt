import Vue from 'vue'
import { getInfo, login, logout } from '@/api/login'
import { ACCESS_TOKEN } from '@/store/mutation-types'
import { welcome } from '@/utils/util'

const user = {
  state: {
    token: '',
    name: '',
    welcome: '',
    avatar: '',
    roles: [],
    info: {}
  },
  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_NAME: (state, { name, welcome }) => {
      state.name = name
      state.welcome = welcome
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_INFO: (state, info) => {
      state.info = info
    }
  },
  actions: {
    Login ({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        //api
        login(userInfo).then(response => {
          const token = response.result.token
          Vue.ls.set(ACCESS_TOKEN, token, 7 * 24 * 60 * 60 * 1000)
          commit('SET_TOKEN', token)
          console.log('SET_TOKEN: ', token)
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },
    GetInfo: function({ commit }) {
      return new Promise((resolve, reject) => {
        const token = Vue.ls.get(ACCESS_TOKEN)
        getInfo(token).then(response => {
          //todo: restful style need a protocol between fe and be, or code break when Backend change.
          const result = response.result

          if (result.role && result.role.permissions.length > 0)
          {
            const role = result.role

            role.permissions = result.role.permissions
            role.permissions.map(p => {
              if (p.actionEntitySet != null && p.actionEntitySet.length > 0) {
                // build new actionList from `actionEntitySet`
                p.actionList = p.actionEntitySet.map(x => { return x.action })
              }
            })
            // build permissionList from `permissionId`
            role.permissionList = role.permissions.map(p => { return p.permissionId })

            //save role
            commit('SET_ROLES', result.role)
            commit('SET_INFO', result)
          }
          else
          {
            reject(new Error('getInfo: roles must be a non-null array !'))
          }

          commit('SET_NAME', { name: result.name, welcome: welcome() })
          commit('SET_AVATAR', result.avatar)

          resolve(response)
        }).catch(error => {
          console.log('getInfo: ', error)
          reject(error)
        })
      })
    },
    Logout ({ commit, state }) {
      return new Promise((resolve) => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        Vue.ls.remove(ACCESS_TOKEN)

        logout(state.token).then(() => {
          resolve()
        }).catch(() => {
          resolve()
        })
      })
    }
  }
}

export default user
