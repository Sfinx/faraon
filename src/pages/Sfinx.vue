<template>
  <q-page class="flex flex-center">
    <q-resize-observer @resize="onResize" />
    <div @dblclick="plotlyDoubleClick" @contextmenu="rightClick">
      <q-menu
          v-model="showMenu"
          transition-show="fade"
          transition-hide="fade"
          :context-menu="true"
          @contextmenu.prevent
      >
        <q-list style="min-width: 100px">
          <q-item class="bg-orange">
            <q-item-section>{{ 'Actions in ' + (menuSlice.name ? menuSlice.name : 'Dao') }}</q-item-section>
          </q-item>
          <q-separator />
          <q-item v-if="!$q.$store.movingSlice" clickable v-close-popup @click="newEditSlice()">
            <q-item-section>Add Slice</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="newEditSlice(true)">
            <q-item-section>Edit Slice</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="moveSlice()">
            <q-item-section>Move Slice</q-item-section>
          </q-item>
          <q-item v-if="$q.$store.movingSlice" clickable v-close-popup @click="moveSlice(true)">
            <q-item-section>Cancel Slice Move</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="deleteSlice(0)">
            <q-item-section class='text-red'>Delete Slice by trimming</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="deleteSlice(1)">
            <q-item-section class='text-red'>Delete Slice Recursivly</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
      <plotly v-if="plotlyData?.length > 0" :key="plotlyRedraw" @afterplot="plotlyAfterPlot" @hover="plotlyHover" @unhover="plotlyUnHover" @click="plotlyClick" :data="plotlyData" :layout="plotlyLayout"></plotly>
    </div>

    <q-dialog v-model="showSliceDialog" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="user-select: none">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>{{ sliceDialogTitle }}</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>
        <q-card-section class="col items-center">
          <form>
          <q-input v-model="menuSlice.name" outlined label-color="black" label="Slice Name" ref="sliceName" @keydown.enter.prevent="sliceDescription.focus()" class="q-mb-sm"/>
          <q-input v-model="menuSlice.description" outlined label-color="black" label="Slice Description" ref="sliceDescription" @keydown.enter.prevent="sliceProcess" class="q-mb-sm" />
          </form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn class="bg-primary text-white" glossy label="Done" @click="sliceProcess()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import sfinx from '@/sfinx'
import { useQuasar } from 'quasar'
import logger from '@/logger'
import plotly from 'components/Plotly.vue'
import emitter from 'tiny-emitter/instance'

const $q = useQuasar()

let currentSlice = {}
const sliceInitial = {
  name: '',
  description: '',
  id: 0,
  customdata: { }
}

const maxDepth = 3
const menuSlice = reactive({...sliceInitial}) // must have {...} !
const showMenu = ref(false)
const showSliceDialog = ref(false)
const sliceDialogTitle = ref('')
// refs
const sliceName = ref(null)
const sliceDescription = ref(null)
const plotlyRedraw = ref(true)

const plotlyAfterPlot = () => {
  if (plotlyData.value[0].level != selectedSliceId) {
    // logger.error('plotlyAfterPlot: ' + plotlyData.value[0].level + ', selectedSliceId: ' + selectedSliceId)
    setRootSlice(selectedSliceId)
  }
}

const onResize = () => {
  plotlyLayout.width = ($q.screen.width/100) * 81
  plotlyLayout.height = ($q.screen.height/100) * 81
  plotlyRedraw.value++
}

watch(showMenu, shown => {
  if (!shown)
    return
  // if (!currentSlice.name || $q.$store.movingSlice) {
  //   if ($q.$store.movingSlice)
  //     $q.$notify('Still in [' + $q.$store.movingSlice.name + '] slice moving mode')
  //   showMenu.value = false
  //   return
  // }
  if ($q.$store.movingSlice) {
    showMenu.value = true
    return
  }
  if (!currentSlice.name) {
    showMenu.value = false
    return
  }
  Object.assign(menuSlice, currentSlice)
  // menuSlice.name is null for 'Dao' - need this to hide menu entries for it
  menuSlice.name = (currentSlice.id == 1) ? null : currentSlice.name
})

const sliceProcess = () => {
  if (sliceDialogTitle.value.startsWith('Edit')) {
    sfinx.sendMsg('EditSlice', res => {
      if (res.e)
        $q.$notify(res.e)
      else {
        refresh()
        showSliceDialog.value = false
      }
    }, menuSlice)
  } else {
    sfinx.sendMsg('NewSlice', res => {
      if (res.e)
        $q.$notify(res.e)
      else {
        refresh()
        showSliceDialog.value = false
      }
    }, menuSlice)
  }
}

const refresh = (newRoot) => {
  // logger.error('refresh: selectedSliceId :' + selectedSliceId + ', newRoot: ' + newRoot)
  let level = (selectedSliceId == '1' ? undefined : selectedSliceId)
  if (newRoot) { // move back
    level = (newRoot == 1 ? undefined : selectedSliceId) // set to old root for now
    selectedSliceId = newRoot
  }
  sfinx.sendMsg('GetSlices', res => {
  if (res.e)
    $q.$notify(res.e)
   else {
     let slices = {
       labels: [],
       hovertext: [],
       parents: [],
       ids: [],
       customdata: [],
       values: []
     }
     for (let s of res.d.slices) {
       slices.labels.push(s.name + ' [' + s.out_count + ']')
       slices.hovertext.push(s.name + (s.description ? (' (' + s.description + ')') : ''))
       slices.ids.push(s.key)
       if (!slices.parents.length) {
         slices.parents.push('')
         dataRoot = s.key
       } else
          slices.parents.push(s.parent)
       slices.customdata.push({
         parent: s.parent,
         out_count: s.out_count
       })
       slices.values.push(1)
     }
     plotlyData.value = [{ ...slices, ...defaultSunburstData, ...{ level } }]
     $q.$store.total_slices = res.d.total_slices
   }
  }, {
     from: selectedSliceId,
     depth: maxDepth
  })
}

const newEditSlice = edit => {
  sliceDialogTitle.value = edit ? ('Edit ' + menuSlice.name + ' Slice') : ('New Slice in ' + (menuSlice.name ? menuSlice.name : 'Dao'))
  if (!edit) {
    let id = menuSlice.id
    Object.assign(menuSlice, sliceInitial)
    menuSlice.id = id
  } else if (menuSlice.id == '1')
          return
  showSliceDialog.value = true
  setTimeout(() => {
   sliceName.value.focus()
  }, 50)
}

const plotlyDoubleClick = ev => {
  // // console.log('*** plotlyDoubleClick', currentSlice)
  // if (currentSlice.id) {
  //   Object.assign(menuSlice, currentSlice)
  //   newEditSlice(true)
  // }
}

const deleteSlice = mode => {
  if ($q.$store.movingSlice)
    return
  console.log('*** deleteSlice, mode: ' + mode, menuSlice)
  sfinx.sendMsg('DeleteSlice', res => {
  if (res.e)
    $q.$notify(res.e)
   else {
     $q.$store.movingSlice = null
     refresh()
   }
  }, {
    delSlice: menuSlice,
    mode
  })
}

const moveSlice = cancel => {
  if (cancel) {
    sfinx.sendMsg('SliceMoveMode', res => {
      if (res.e)
        $q.$notify(res.e)
       else {
         $q.$store.movingSlice = null
         refresh()
       }
    })
    showMenu.value = false
    return
  }
  if ($q.$store.movingSlice)
    return
  console.log('*** moveSlice start', menuSlice)
  refresh('1')
  sfinx.sendMsg('SliceMoveMode', res => {
  if (res.e)
    $q.$notify(res.e)
   else {
     showMenu.value = false
     $q.$store.movingSlice = menuSlice
   }
  }, {
    movingSlice: menuSlice
  })
}

const rightClick = ev => {
  if (!currentSlice.name) {
    ev.preventDefault()
    return
  }
  // console.log('*** rightClick at', currentSlice)
}

const plotlyHover = e => {
  let p = e.points[0]
  currentSlice = {
    name: p.label?.substr(0, p.label.lastIndexOf(' [')),
    id: p.id,
    description: p.hovertext,
    customdata: p.customdata,
  }
  // console.log('*** plotlyHover c:', currentSlice, 'p:', p)
}

const plotlyUnHover = e => {
  // console.log('*** plotlyUnHover', currentSlice)
  currentSlice = {}
}

let selectedSliceId = '1'
let dataRoot

// plotlyData is array so the only way to trigger change is to assign to it
const setRootSlice = root => {
  if (root == '')
    root = '1'
  // logger.error('setRootSlice: ' + root)
  if (plotlyData.value) {
    plotlyData.value = [{ ...plotlyData.value[0], ...{ level: root } }]
  }
}

const plotlyClick = e => {
  let p = e.points[0]
  if (keyModifier == 'Shift') {
    console.log('*** Sfinx: selected slice: id:', p.id, 'label: [', p.label, '], parentId: ', p.customdata)
    if ($q.$store.movingSlice) {
      sfinx.sendMsg('SliceMoveMode', res => {
      if (res.e)
        $q.$notify(res.e)
       else {
         console.log('*** moveSlice finish', $q.$store.movingSlice)
         $q.$store.movingSlice = null
         refresh()
       }
      }, {
        newParent: { id: p.id }
      })
    }
    return false
  } else { // usual click
      // logger.error('click: selectedSliceId: ' + selectedSliceId + ', dataRoot: ' + dataRoot + ', currentSlice: ' + logger.json(currentSlice))
      selectedSliceId =  currentSlice.id
      if (selectedSliceId != '1') {
        if (selectedSliceId == dataRoot) { // back to parent
          // logger.error('Back to parent: ' + currentSlice.customdata.parent)
          refresh(currentSlice.customdata.parent)
          return false
        }
        if (currentSlice.customdata.out_count) { // move forward by DB
          // logger.error('Move forward')
          refresh()
          return false;
       }
     }
  }
  return true
}

const plotlyLayout = reactive({
  paper_bgcolor: '#8F7D3C',
  transition: {
    duration: 300,
    easing: 'cubic-in-out'
  },
  margin: {l: 0, r: 0, b: 40, t: 40},
  width: ($q.screen.width/100) * 81,
  height: ($q.screen.height/100) * 81
})

const plotlyData = ref(null)

const defaultSunburstData = {
  type: 'sunburst', // sunburst icicle treemap
  outsidetextfont: { size: 20, color: '#377eb8' },
  leaf: { opacity: 1.0 },
  opacity: 1.0,
  hoverinfo: 'text',
  marker: {
    // autocolorscale: false,
    line: { width: 3 }
  },
  root: {
    color: '#e8c61a'
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', keyDown)
  window.removeEventListener('keyup', keyDown)
  emitter.off('ReturnToDao')
})

onMounted(() => {
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  refresh()
  emitter.on('ReturnToDao', () => {
    // logger.error('Return to Dao from ' + dataRoot)
    if (dataRoot != '1')
      refresh('1')
    else
      setRootSlice()
  })
})

let keyModifier = null
const keyDown = e => {
  keyModifier = e.key
}
const keyUp = e => {
  keyModifier = null
}
</script>
<style>
.main-svg {
  background: rgba(100, 100, 100, 0) !important;
}
</style>
