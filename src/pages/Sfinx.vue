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
            <q-item v-if="!$q.$store.movingSlice" clickable>
              <q-item-section>Add Document</q-item-section>
              <q-item-section side>
                <q-icon name="keyboard_arrow_right" />
              </q-item-section>

              <q-menu anchor="top end" self="top start">
                <q-list>
                  <q-item clickable v-close-popup @click="newEditNote()">
                    <q-item-section>Add Note</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section>Add Person</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section>Add Know How</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section>Add File</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-item>
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
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="trimSliceDialog = true">
            <q-item-section class='text-red'>Delete Slice by trimming</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="deleteSliceDialog = true">
            <q-item-section class='text-red'>Delete Slice Recursively</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
      <plotly v-if="plotlyData?.length > 0" :key="plotlyRedraw" @afterplot="plotlyAfterPlot" @hover="plotlyHover" @unhover="plotlyUnHover" @click="plotlyClick" :data="plotlyData" :layout="plotlyLayout"></plotly>
    </div>

    <q-dialog v-model="showSliceSelectionDialog" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="user-select: none; min-width: 43%;">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>Select Slice</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>
        <q-card-section class="col items-center">
          <div>
            <selectSlice :key="plotlyRedraw" :maxDepth="maxDepth" :returnToDao="selectSliceReturnToDao" :selected="sliceSelected" :layout="selectSliceLayout"/>
            <q-btn class="bg-secondary text-white" glossy label="Return to Dao" @click="selectSliceReturnToDao++" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showNoteDialog" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="user-select: none; min-width: 80%; min-height: 80%">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>{{ noteDialogTitle }}</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>
        <q-card-section class="col items-center">
          <form>
          <q-input v-model="note.name" outlined label-color="black" label="Note Name" ref="noteName" @keydown.enter.prevent="noteURL.focus()" class="q-mb-sm"/>
          <q-input v-model="note.url" outlined label-color="black" label="Note URL" ref="noteURL" @keydown.enter.prevent="noteDescription.focus()" class="q-mb-sm"/>
          <q-editor
            class="q-mb-sm"
            v-model="note.description"
            :dense="$q.screen.lt.md"
            min-height="49vh"
            :toolbar="[
              [
                {
                  label: $q.lang.editor.align,
                  icon: $q.iconSet.editor.align,
                  fixedLabel: true,
                  options: ['left', 'center', 'right', 'justify']
                }
              ],
              ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
              ['token', 'hr', 'link', 'custom_btn'],
              [
                {
                  label: $q.lang.editor.formatting,
                  icon: $q.iconSet.editor.formatting,
                  list: 'no-icons',
                  options: [
                    'p',
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'code'
                  ]
                },
                {
                  label: $q.lang.editor.fontSize,
                  icon: $q.iconSet.editor.fontSize,
                  fixedLabel: true,
                  fixedIcon: true,
                  list: 'no-icons',
                  options: [
                    'size-1',
                    'size-2',
                    'size-3',
                    'size-4',
                    'size-5',
                    'size-6',
                    'size-7'
                  ]
                },
                {
                  label: $q.lang.editor.defaultFont,
                  icon: $q.iconSet.editor.font,
                  fixedIcon: true,
                  list: 'no-icons',
                  options: [
                    'default_font',
                    'arial',
                    'arial_black',
                    'comic_sans',
                    'courier_new',
                    'impact',
                    'lucida_grande',
                    'times_new_roman',
                    'verdana'
                  ]
                },
                'removeFormat'
              ],
              ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

              ['undo', 'redo'],
              ['fullscreen']
            ]"
            :fonts="{
              arial: 'Arial',
              arial_black: 'Arial Black',
              comic_sans: 'Comic Sans MS',
              courier_new: 'Courier New',
              impact: 'Impact',
              lucida_grande: 'Lucida Grande',
              times_new_roman: 'Times New Roman',
              verdana: 'Verdana'
            }"
          />
          <span style="cursor: pointer;" @click="showSliceSelection()" >Slices: {{ noteSlices }}</span>
          </form>
        </q-card-section>
        <q-card-actions align="between">
          <q-btn class="bg-secondary text-white" glossy label="Clear Slices" @click="noteClearSlices()"/>
          <q-btn class="bg-secondary text-white" glossy label="Done" @click="noteProcess()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

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

    <q-dialog v-model="trimSliceDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Slice Trimming</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ 'Are you sure that want to trim the \'' + menuSlice.name + '\' slice ?' }}
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Yes" @click="deleteSlice(0)" />
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteSliceDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Slice Deletion</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ 'Are you sure that want to recursively delete the \'' + menuSlice.name + '\' slice ?' }}
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Yes" @click="deleteSlice(1)" />
          <q-btn flat label="Close" v-close-popup />
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
import selectSlice from 'components/SelectSlice.vue'
import emitter from 'tiny-emitter/instance'

const $q = useQuasar()

const trimSliceDialog = ref(false)
const deleteSliceDialog = ref(false)

let currentSlice = {}
const sliceInitial = {
  name: '',
  description: '',
  id: 0,
  customdata: { }
}

const selectSliceReturnToDao = ref(0)
const showSliceSelectionDialog = ref(false)

const showNoteDialog = ref(false)
const noteName = ref(null)
const noteURL = ref(null)
const noteDescription = ref(null)
const noteDialogTitle = ref('')

const noteInitial = {
  name: '',
  url: '',
  description: '',
  slices: []
}

let note = reactive({...noteInitial})

const maxDepth = 3
const menuSlice = reactive({...sliceInitial}) // must have {...} !
const showMenu = ref(false)
const showSliceDialog = ref(false)
const sliceDialogTitle = ref('')
// refs
const sliceName = ref(null)
const sliceDescription = ref(null)
const plotlyRedraw = ref(true)

const noteClearSlices = () => note.slices.length = 1

String.prototype.lastIndexOfEnd = function(string) {
  var io = this.lastIndexOf(string);
  return io == -1 ? -1 : io + string.length;
}

const sliceSelected = slice => {
  let s = {
    name: slice.label.slice(0, slice.label.lastIndexOfEnd(' [') - 2),
    id: slice.id
  }
  note.slices.push(s)
  showSliceSelectionDialog.value = false
}

const showSliceSelection = () => showSliceSelectionDialog.value = true

const plotlyAfterPlot = () => {
  if (plotlyData.value[0].level != selectedSliceId) {
    // logger.error('plotlyAfterPlot: ' + plotlyData.value[0].level + ', selectedSliceId: ' + selectedSliceId)
    setRootSlice(selectedSliceId)
  }
}

const onResize = () => {
  plotlyLayout.width = ($q.screen.width/100) * 81
  plotlyLayout.height = ($q.screen.height/100) * 81
  selectSliceLayout.width = ($q.screen.width/100) * 40
  selectSliceLayout.height = ($q.screen.height/100) * 71
  plotlyRedraw.value++
}

watch(showMenu, shown => {
  if (!shown)
    return
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

const noteSlices = computed(() => {
  let slices = ''
  for (let s of note.slices) {
    if (slices.length)
      slices += ', '
    slices += '\'' + s.name + '\''
  }
  return '[' + slices + ']'
})

const newEditNote = edit => {
  noteDialogTitle.value = edit ? ('Edit ' + note.name + ' Note') : ('New Note')
  noteDialogTitle.value += ' in ' + (menuSlice.name ? menuSlice.name : 'Dao')
  if (!edit)
    Object.assign({ note, noteInitial })
  let is = {
    name: menuSlice.name ? menuSlice.name : 'Dao',
    id: menuSlice.id
  }
  note.slices.push(is)
  showNoteDialog.value = true
  setTimeout(() => {
   noteName.value.focus()
  }, 50)
}

const noteProcess = () => {
  if (noteDialogTitle.value.startsWith('Edit')) {
    sfinx.sendMsg('EditNote', res => {
      if (res.e)
        $q.$notify(res.e)
      else {
        refresh()
        showNoteDialog.value = false
      }
    }, note)
  } else {
    sfinx.sendMsg('NewNote', res => {
      if (res.e)
        $q.$notify(res.e)
      else {
        refresh()
        showNoteDialog.value = false
      }
    }, note)
  }
}

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
     $q.$store.total_documents = res.d.total_documents
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
  // console.log('*** deleteSlice, mode: ' + mode, menuSlice)
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
  // console.log('*** moveSlice start', menuSlice)
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
    // console.log('*** Sfinx: selected slice: id:', p.id, 'label: [', p.label, '], parentId: ', p.customdata)
    if ($q.$store.movingSlice) {
      sfinx.sendMsg('SliceMoveMode', res => {
      if (res.e)
        $q.$notify(res.e)
       else {
         // console.log('*** moveSlice finish', $q.$store.movingSlice)
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
          return false
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

const selectSliceLayout = reactive({
  paper_bgcolor: '#8F7D3C',
  transition: {
    duration: 300,
    easing: 'cubic-in-out'
  },
  margin: {l: 0, r: 0, b: 0, t: 20},
  width: ($q.screen.width/100) * 40,
  height: ($q.screen.height/100) * 71
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
