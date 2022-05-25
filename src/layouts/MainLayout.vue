<template>
  <q-layout @contextmenu.prevent view="lHh Lpr lFf">

    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>Faraon</q-toolbar-title>
        <q-btn
            flat
            dense
            icon="mdi-account-key"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
    <q-list class="body--dark text-weight-bold text-grey-10 text-h6">

        <q-item-label header class="text-h6 text-weight-medium text-black">Menu</q-item-label>

        <q-separator color="black" inset />

        <q-item clickable @click="showLogin()" v-if="!$q.$store.loggedUser">
          <q-item-section avatar>
            <q-icon name="mdi-login" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Login</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-if="$q.$store.loggedUser" @click="sfinx.logout()" to="/" style="text-decoration: none; color: inherit;">
          <q-item-section avatar>
            <q-icon name="mdi-logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Logout</q-item-label>
          </q-item-section>
        </q-item>

    </q-list>

    </q-drawer>

    <q-dialog v-model="loginDlg" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="user-select: none">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>Sfinx Login</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>
        <q-card-section class="col items-center">
          <form>
          <q-input autocomplete="username" maxlength=16 v-model="user" outlined label-color="black" label="Username" ref="loginUser" @keydown.enter.prevent="loginPass.focus()" class="q-mb-sm"/>
          <q-input autocomplete="current-password" v-model="pass" outlined :type="isPwd ? 'password' : 'text'" label-color="black" label="Password" ref="loginPass" @keydown.enter.prevent="login" class="q-mb-sm">
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
          </form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn class="bg-primary text-white" glossy label="Login" @click="login"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-footer elevated class="bg-primary text-white text-h5" style="user-select: none">
      <q-toolbar>
        <q-btn glossy color="secondary" label="Return to Dao" @click="emitter.emit('ReturnToDao')" />
        <q-toolbar-title class="absolute-right q-mt-sm q-mr-md">
          {{ logInfo }}
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>

import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import sfinx from '@/sfinx'
import { useQuasar } from 'quasar'
import logger from '@/logger'
import { app } from '@/boot/app.js'
import emitter from 'tiny-emitter/instance'

const router = useRouter()
const $q = useQuasar()
const leftDrawerOpen = ref(false)
const toggleLeftDrawer = () => leftDrawerOpen.value = !leftDrawerOpen.value
const waitIcon = ref(false)
const user = ref('')
const pass = ref('')
const isPwd = ref(true)
const loginDlg = ref(false)
const loginUser = ref(null)
const loginPass = ref(null)
const debugKey = ref('')
const sid = ref('')
const sfinxHost = ref('localhost')

watch(loginDlg, (loginDlg, prevLoginDlg) => {
  if (loginDlg)
   window.addEventListener('keydown', keyDown)
  else
   window.removeEventListener('keydown', keyDown)
})

const logInfo = computed(() => $q.$store.loggedUser ? ('Logged as ' + $q.$store.loggedUser.footer + ' to sfinx://' + sfinxHost.value +' [Total ' + $q.$store.total_slices + ' slices, 123 documents]') : 'Not logged in')

const keyDown = e => {
  debugKey.value = e.key
}
const setWaitIcon = (v, m) => {
  waitIcon.value = (v == true) ? v : null
  if (v)
    $q.loading.show({ message: m })
  else
    $q.loading.hide()
}
const validate = isReg => {
  if (sfinx.tooFastAuth()) {
   $q.$notify('Too fast auth !')
   return false
  }
  return true
}
const login = () => {
  if (!sid.value || waitIcon.value || !validate()) {
   if (!sid.value)
     $q.$notify('Not connected')
   return
  }
  if (debugKey.value == 'Shift')
    app.parameters.debug = 1
  else if (debugKey.value == 'Alt')
    app.parameters.debug = 2
  else if (debugKey.value == 'Control')
    app.parameters.debug = 3
  if (app.parameters.debug)
    logger.info('Setting debug level to ' + app.parameters.debug)
  setWaitIcon(true, 'Loggin in ...')
  sfinx.login(user.value, pass.value, res => {
    setWaitIcon(false)
    if (res.e)
      $q.$notify('Login failed: ' + res.e)
    else {
      let u = {
        footer: user.value
      }
      $q.$store.total_slices = res.d.total_slices
      $q.$store.loggedUser = u
      loginDlg.value = false
      $q.$notify('Logged as ' + u.footer)
      router.push('/sfinx', {})
    } // login ok
  })
}
const showLogin = () => {
  isPwd.value = true
  user.value = 'rus'
  pass.value = 'pass'
  setTimeout(() => { loginUser.value.focus() }, 20)
  loginDlg.value = true
  // debug
  setTimeout(() => {
    login()
  }, 100)
}
const connected = res => {
  setWaitIcon(false)
  logger.info('connected to sfinx server with API v' + res.version + ', ' + res.build_type + ' build: ' + res.build + ', sid: ' + res.sid)
  sid.value = res.sid
  showLogin()
}
const disconnected = msg => {
  if ($q.$store.loggedUser)
    $q.$notify($q.$store.loggedUser.footer + ' logged out')
  $q.$store.loggedUser = null
  sid.value = null
  debugKey.value = null
  if (!msg)
   router.push('/', {})
}
onMounted(() => {
  disconnected(true)
  setWaitIcon(true, 'Connecting to server ...')
  sfinx.connect(connected, disconnected)
})

</script>
