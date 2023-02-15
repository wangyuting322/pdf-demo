import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Preview from '../views/Preview.vue'
import SignTest from '../views/SignTest.vue'
import EditPic from '../views/EditPic.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'HomeView',
    component: HomeView
  },
  {
    path: '/preview',
    name: 'Preview',
    component: Preview
  },
  {
    path: '/SignTest',
    name: 'SignTest',
    component: SignTest
  },
  {
    path: '/EditPic',
    name: 'EditPic',
    component: EditPic
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
