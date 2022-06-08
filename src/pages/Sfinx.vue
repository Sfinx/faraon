<template>
  <q-page class="flex flex-center" style="user-select: none;">
    <q-resize-observer @resize="onResize" />

    <!-- main slices tree -->
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
                <q-list v-for="docType in documentTypes">
                  <q-item clickable v-close-popup @click="newOrEditDocument(docType, false)">
                    <q-item-section>Add {{ docType }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-item>
          <q-item v-if="!$q.$store.movingSlice" clickable v-close-popup @click="newOrEditSlice()">
            <q-item-section>Add Slice</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="newOrEditSlice(true)">
            <q-item-section>Edit Slice</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="moveSlice()">
            <q-item-section>Move Slice</q-item-section>
          </q-item>
          <q-item v-if="$q.$store.movingSlice" clickable v-close-popup @click="moveSlice(true)">
            <q-item-section>Cancel Slice Move</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="deleteConfirm.ask('Confirm Slice Trimming', 'Are you sure that want to trim the \'' + menuSlice.name + '\' slice ?',
              () => deleteSlice())">
            <q-item-section class='text-red'>Delete Slice by trimming</q-item-section>
          </q-item>
          <q-item v-if="menuSlice.name && !$q.$store.movingSlice" clickable v-close-popup @click="deleteConfirm.ask('Confirm Recursive Slice Deletion', 'Are you sure that want to recursively delete the \'' + menuSlice.name + '\' slice ?',
              () => deleteSlice(1))">
            <q-item-section class='text-red'>Delete Slice Recursively</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
      <plotly v-if="plotlyData?.length > 0" ref="plotlyRef" @afterplot="plotlyAfterPlot" @hover="plotlyHover" @unhover="plotlyUnHover" :click="plotlyClick" :data="plotlyData" :layout="plotlyLayout"></plotly>
    </div>

    <!-- documents browser -->
    <div class="q-pa-md" style="z-index: 10; position: absolute;top: 0; left: 0; height: 100%; width: 30%;">
      <q-card class="q-dialog-plugin" style="user-select: none; height: 100%; min-width: 95%;">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>{{ documentsTitle }}</q-toolbar-title>
        </q-toolbar>
        <q-input dense outlined label-color="black" label="Search" style="height: 6%" class="q-ma-sm"/>
        <!-- <q-card-section style="height: 100%;"> -->
          <q-table
            dense
            class="sticky-header-table"
            style="height: 76%;"
            ref="documentsTable"
            :rows="documentRows"
            :columns="documentColumns"
            selection="multiple"
            :selected="documentsSelected"
            @selection="onDocumentSelection"
            :selected-rows-label="getDocumentSelectedString"
            :rows-per-page-options="[0]"
            row-key="id"
            @row-click="selectDocument"
            @row-dblclick="(evt, document, index) => Object.assign(viewDocumentDialog, { on: true, document })"
            no-data-label="No documents yet"
          >
            <template v-slot:body-cell-type="props" >
              <q-td class="text-left">
                <!-- <q-icon name="xyz" class="q-mr-md"/> -->
                <q-badge
                  class="q-ml-xs"
                  style="height: 25px"
                  color="green"
                  :label="sfinx.getDocumentType(props.value)"
                ></q-badge>
              </q-td>
            </template>
          </q-table>
        <!-- </q-card-section> -->
        <q-card-actions align="between">
          <div>
            <q-btn class="dense bg-secondary text-white" glossy label="Filter"> <!-- by slices / by type / orphans only -->
              <q-menu style="user-select: none;">
                <q-list style="min-width: 120px">
                  <q-item>
                    <div class="column">
                      <q-toggle v-close-popup v-model="documentsSelect.all" @click="documentsTypeSelect" label="All Documents" />
                      <q-toggle v-close-popup v-model="documentsSelect.orphans" @click="documentsTypeSelect" label="Orphans only" />
                      <q-separator />
                      <q-item clickable>
                        <q-item-section>By Type</q-item-section>
                        <q-item-section side>
                          <q-icon name="keyboard_arrow_right" />
                        </q-item-section>
                        <q-menu>
                          <q-list style="min-width: 120px">
                            <q-item>
                              <div class="column">
                                <q-toggle v-close-popup v-model="documentsSelect.types.note" @click="documentsTypeSelect" label="Notes" />
                                <q-toggle v-close-popup v-model="documentsSelect.types.file" @click="documentsTypeSelect" label="Files" />
                                <q-toggle v-close-popup v-model="documentsSelect.types.event" @click="documentsTypeSelect" label="Events" />
                                <q-toggle v-close-popup v-model="documentsSelect.types.person" @click="documentsTypeSelect" label="Persons" />
                                <q-toggle v-close-popup v-model="documentsSelect.types.knowhow" @click="documentsTypeSelect" label="KnowHows" />
                                <q-toggle v-close-popup v-model="documentsSelect.types.todo" @click="documentsTypeSelect" label="ToDos" />
                                <q-toggle v-close-popup v-model="documentsSelect.types.aim" @click="documentsTypeSelect" label="Aims" />
                                <q-item v-close-popup style="user-select: none;" @click="documentsAllTypes" clickable>All types</q-item>
                              </div>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-item>
                    </div>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <div class="q-gutter-sm">
            <q-btn class="dense bg-red text-white" glossy label="Delete" @click="deleteTheDocument" />
            <q-btn class="dense bg-secondary text-white" glossy label="Edit" @click="editDocument()" />
            <q-btn class="dense bg-secondary text-white" glossy label="New">
              <q-menu>
                <q-list v-for="docType in documentTypes" style="min-width: 120px">
                  <q-item clickable v-close-popup @click="newOrEditDocument(docType, false, documentsFilter)">
                    <q-item-section>{{ docType }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-card-actions>
      </q-card>
    </div>

    <q-dialog v-model="showSliceSelectionDialog" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="user-select: none; min-width: 43%;">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>Select Slice</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>
        <q-card-section class="col items-center">
          <div>
            <selectSlice ref="selectSliceRef" :layout="selectSliceLayout" :maxDepth="maxDepth"  :selected="sliceSelected" />
            <q-btn class="bg-secondary text-white" glossy label="Return to Dao" @click="selectSliceRef.toDao()" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showNewOrEditNoteDialog" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="user-select: none; min-width: 80%; min-height: 80%">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>{{ noteDialogTitle }}</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>
        <q-card-section class="col items-center">
          <form>
          <q-input v-model="note.name" outlined label-color="black" label="Note Name" ref="noteName" @keydown.enter.prevent="noteDescription.focus()" class="q-mb-sm"/>
          <q-editor
            class="q-mb-sm"
            v-model="note.description"
            :dense="$q.screen.lt.md"
            height="49vh"
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
          <div @click="showSliceSelection()">
            <q-select
              filled
              v-model="note.slices"
              multiple
              dense
              use-chips
              stack-label
              label="Slices"
            >
              <template v-slot:selected-item="scope">
                <q-chip
                  removable
                  dense
                  @mouseenter="sfinx.showFullSlicePath(scope.opt)"
                  @remove="scope.removeAtIndex(scope.index)"
                  :tabindex="scope.tabindex"
                  class="q-mr-xs"
                >
                <!-- color="white"
                text-color="secondary" -->
                  {{ scope.opt.name }}
                </q-chip>
              </template>
            </q-select>
          </div>
          </form>
        </q-card-section>
        <q-card-actions align="between">
          <q-btn class="bg-secondary text-white" glossy label="Clear Slices" @click="noteClearSlices()"/>
          <q-btn class="bg-secondary text-white" glossy label="Done" @click="noteProcess()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="viewDocumentDialog.on" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="min-width: 33vw;">
        <q-toolbar style="user-select: none;" class="bg-primary glossy text-white">
          <q-toolbar-title>{{ viewDocumentDialog.document.name }}</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>
        <q-card-section class="items-center q-mx-xs q-mt-xs">
            <view-document :document="viewDocumentDialog.document" @error="e => { $q.$notify('ViewDocument Error: ' + e); viewDocumentDialog.on = false }" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn class="bg-secondary text-white q-mr-xs" glossy label="Edit" @click="viewDocumentDialog.on = false; editDocument(viewDocumentDialog.document)"/>
          <q-btn class="bg-secondary text-white" glossy label="Done" @click="viewDocumentDialog.on = false"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showNewOrEditSliceDialog" persistent transition="scale">
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

    <q-dialog v-model="deleteConfirm.on">
      <q-card class="q-ma-lg">
        <q-card-section>
          <div class="text-h6">{{ deleteConfirm.title }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">{{ deleteConfirm.text }}</q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Yes" @click="deleteConfirm.ok" />
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
import viewDocument from 'components/ViewDocument.vue'
import emitter from 'tiny-emitter/instance'
import { format } from 'fecha'
import { app } from '@/boot/app.js'

const deleteTheDocument = () => {
  if (documentsSelected.value?.length != 1)
    return
  let doc = documentsSelected.value[0]
  deleteConfirm.ask('Confirm Document Deletion', 'Are you sure that want to delete the ' + doc.type + ' \'' + doc.name + '\' ?', () => deleteDocument())
}

const selectSliceRef = ref(null)

const $q = useQuasar()

const documentTypes = ['Note', 'File', 'Event', 'Person', 'KnowHow', 'Todo', 'Aim']

let viewDocumentDialog = reactive({ on: false, document: null })

let deleteConfirm = reactive({
  on: false,
  title: '',
  text: '',
  cb: null,
  ask: (title, text, precheck, okCb) => {
    if (!okCb) {
      okCb = precheck
      precheck = null
    }
    if (precheck && !precheck())
      return
    deleteConfirm.title = title
    deleteConfirm.text = text
    deleteConfirm.cb = okCb
    deleteConfirm.on = true
  },
  ok: (ev) => {
    deleteConfirm.cb()
    deleteConfirm.on = false
  }
})

const documentColumns = [
  { name: 'type', align: 'left', label: 'Type', field: 'type', sortable: true, headerStyle: "max-width: 40px" },
  { name: 'name', align: 'center', label: 'Name', field: 'name', sortable: true, format: (v, r) => {
      if (v.length > 10)
        return v.substring(0, 10) + '..'
      return v
    }
  },
  { name: 'description', align: 'center', label: 'Description', field: 'description', sortable: true, format: (v, r) => {
      if (v.length > 10)
        return v.substring(0, 10) + '..'
      return v
    }
  },
  { name: 'ctime', align: 'center', label: 'Stamp', field: 'ctime', sortable: true, format: (val, row) => {
      let d = new Date(val * 1000)
      return format(d, 'DD/MM/YY hh:mm:ss')
    }
  }
]

const documentsTable = ref(null)
const documentsSelected = ref([])
const documentlastIndex = ref(null)

const deleteDocument = () => {
  let doc = documentsSelected.value[0]
  try {
    eval('delete' + sfinx.getFullDocumentType(doc))(doc)
  } catch(e) {
    logger.error('deleteDocument: ' + e.message)
  }
}

const editDocument = (doc) => {
  if (!doc) {
    if (!documentsSelected.value.length || (documentsSelected.value.length > 1))
      return
    doc = documentsSelected.value[0]
  }
  newOrEditDocument(sfinx.getFullDocumentType(doc), true, doc)
}

const newOrEditDocument = (docType, edit, inSlice) => {
  try {
    eval('newOrEdit' + docType)(edit, inSlice)
  } catch(e) {
    logger.error('newOrEditDocument: ' + e.message)
  }
}

const documentPresent = (row) => {
  for (let [idx, r] of documentsSelected.value?.entries()) {
    if (r.id == row.id)
      return idx
  }
  return -1
}
const selectDocument = (evt, row, index) => {
  const selectedIndex = documentPresent(row)
  if (documentPresent(row) > -1)
    documentsSelected.value = documentsSelected.value.slice(0, selectedIndex).concat(documentsSelected.value.slice(selectedIndex + 1))
  else
    documentsSelected.value = documentsSelected.value.concat(row)
}

const getDocumentSelectedString = () => documentsSelected.value.length === 0 ? '' : `${documentsSelected.value.length} record${documentsSelected.value.length > 1 ? 's' : ''} selected of ${documentRows.value.length}`

const onDocumentSelection = ({ rows, added, evt }) => {

  if (rows.length === 0 || documentsTable.value === void 0)
   return

  const row = rows[0]
  const filteredSortedRows = documentsTable.value.filteredSortedRows
  const rowIndex = filteredSortedRows.indexOf(row) // documentPresent(row) ??
  const localLastIndex = documentlastIndex.value

  documentlastIndex.value = rowIndex
  document.getSelection().removeAllRanges()

  if ($q.platform.is.mobile === true)
   evt = { ctrlKey: true }
  else if (evt !== Object(evt) || (evt.shiftKey !== true && evt.ctrlKey !== true)) {
   documentsSelected.value = added === true ? rows : []
   return
  }

  const operateSelection = added === true
   ? selRow => {
     const selectedIndex = documentPresent(selRow)
     if (selectedIndex === -1)
      documentsSelected.value = documentsSelected.value.concat(selRow)
   }
   : selRow => {
     const selectedIndex = documentPresent(selRow)
     if (selectedIndex > -1)
      documentsSelected.value = documentsSelected.value.slice(0, selectedIndex).concat(documentsSelected.value.slice(selectedIndex + 1))
   }

  if (localLastIndex === null || evt.shiftKey !== true) {
   operateSelection(row)
   return
  }

  const from = localLastIndex < rowIndex ? localLastIndex : rowIndex
  const to = localLastIndex < rowIndex ? rowIndex : localLastIndex
  for (let i = from; i <= to; i += 1)
   operateSelection(filteredSortedRows[i])
}

const documentRows = ref([])

let currentHoveredSlice = {}
const getSliceInitial = () => {
  return {
    name: '',
    description: '',
    id: 0,
    customdata: { }
  }
}

const selectSliceReturnToDao = ref(0)
const showSliceSelectionDialog = ref(false)

const showNewOrEditNoteDialog = ref(false)
const noteName = ref(null)
const noteDescription = ref(null)
const noteDialogTitle = ref('')

const getNoteInitial = () => {
  return {
    name: '',
    description: '',
    slices: []
  }
}

let note = reactive(getNoteInitial())

const maxDepth = 3
const menuSlice = reactive(getSliceInitial()) // it always doing two way binding !
const showMenu = ref(false)
const showNewOrEditSliceDialog = ref(false)
const sliceDialogTitle = ref('')
// refs
const sliceName = ref(null)
const sliceDescription = ref(null)
const plotlyRef = ref(null)

const noteClearSlices = () => note.slices.length = 0

const sliceSelected = slice => {
  let name = slice.label.substr(0, slice.label.lastIndexOf(sfinx.sliceSeparator))
  // no sense to have several instances of the same slice
  for (let s of note.slices) {
    if (s.id == slice.id) {
      $q.notify('Slice \'' + name + '\' already assigned')
      return
    }
  }
  note.slices.push({
    name,
    id: slice.id
  })
  showSliceSelectionDialog.value = false
}

const showSliceSelection = () => showSliceSelectionDialog.value = true

const plotlyAfterPlot = () => {
  // logger.trace('plotlyAfterPlot: ' + plotlyData.value[0].level + ', selectedSliceId: ' + selectedSliceId + ', dataRoot: ' + dataRoot)
  if (plotlyData.value[0].level != dataRoot) {
    setRootSlice(dataRoot)
  }
}

const onResize = () => {
  plotlyLayout.width = ($q.screen.width/100) * 81
  plotlyLayout.height = ($q.screen.height/100) * 81
  selectSliceLayout.width = ($q.screen.width/100) * 40
  selectSliceLayout.height = ($q.screen.height/100) * 71
  if (plotlyRef.value)
    plotlyRef.value.resize()
  if (selectSliceRef.value)
    selectSliceRef.value.resize()
}

const getDocumentsFilterDefault = () => {
  return {
    orphans: false,
    all: false,
    types: [],
    slices: [{ name: 'Dao', id: '1' }]
    }
}

let documentsFilter = reactive(getDocumentsFilterDefault())

const documentsSelect = reactive({
  all: false,
  orphans: false,
  types: {
    note: false,
    file: false,
    event: false,
    person: false,
    knowhow: false,
    todo: false,
    aim: false
  }
})

// click event
const documentsTypeSelect = () => {
  setTimeout(() => {
    let types = []
    for (const [key, value] of Object.entries(documentsSelect.types)) {
      if (value == true)
        types.push(key)
    }
    Object.assign(documentsFilter, documentsFilter, { all: documentsSelect.all, orphans: documentsSelect.orphans, types })
  }, 10)
}

watch(documentsSelect, (d, dprev) => {
  if (d.all)
    Object.assign(documentsSelect, documentsSelect, {all : true, orphans: false })
  if (d.orphans)
    Object.assign(documentsSelect, documentsSelect, {all : false, orphans: true })
})

const documentsAllTypes = () => {
  let types = {}
  let assign = false
  for (const [key, value] of Object.entries(documentsSelect.types)) {
    if (value)
      assign = true
    types[key] = false
  }
  if (assign) {
    Object.assign(documentsSelect, documentsSelect, { types })
    documentsTypeSelect()
  }
}

watch(documentsFilter, n => refreshDocuments())

watch(showMenu, shown => {
  if (!shown)
    return
  if ($q.$store.movingSlice) {
    showMenu.value = true
    return
  }
  if (!currentHoveredSlice.name) {
    showMenu.value = false
    return
  }
  Object.assign(menuSlice, currentHoveredSlice)
  // menuSlice.name is null for 'Dao' - need this to hide menu entries for it
  menuSlice.name = (currentHoveredSlice.id == 1) ? null : currentHoveredSlice.name
})

const documentsTitle = computed(() => {
  return documentsFilter.all ? 'All Documents' : (documentsFilter.orphans ? 'Orphan Documents' : ('Documents in ' + getSlicesNames(documentsFilter)))
})

const getSlicesNames = d => {
  let label = d.slices.length ? '' : 'Dao'
  for (let s of d.slices) {
    if (label !== '')
      label += ', '
    label += s.name
  }
  return label
}

const newOrEditNote = (edit, inSlice) => {
  let inSlices = ''
  if (!edit) {
    if (!inSlice)
      inSlice = {
        slices: [menuSlice]
      }
    inSlices = getSlicesNames(inSlice)
    Object.assign(note, getNoteInitial())
    note.slices = inSlice.slices
  } else {
    if (!documentsFilter.orphans) {
      for (let s of inSlice.slices) {
        if (inSlices != '')
          inSlices += ', '
        inSlices += s.name
      }
    }
    Object.assign(note, inSlice)
  }
  noteDialogTitle.value = edit ? ('Edit ' + (documentsFilter.orphans ? 'Orphan ' : '') + '\'' + note.name + '\' Note') : ('New Note')
  noteDialogTitle.value += (' in [' + inSlices + ']')
  showNewOrEditNoteDialog.value = true
  setTimeout(() => {
   noteName.value.focus()
  }, 50)
}

const deleteNote = (note) => {
  sfinx.sendMsg('DeleteNote', res => {
    if (res.e)
      $q.$notify(res.e)
    else {
      refreshDocuments()
      $q.$store.total_documents--
      documentsSelected.value = []
    }
  }, note)
}

const noteProcess = () => {
  if (noteDialogTitle.value.startsWith('Edit')) {
    sfinx.sendMsg('EditNote', res => {
      if (res.e)
        $q.$notify(res.e)
      else {
        refreshDocuments()
        documentsSelected.value = []
        showNewOrEditNoteDialog.value = false
      }
    }, note)
  } else {
    sfinx.sendMsg('NewNote', res => {
      if (res.e)
        $q.$notify(res.e)
      else {
        refreshDocuments()
        documentsSelected.value = []
        showNewOrEditNoteDialog.value = false
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
        refreshSlices()
        showNewOrEditSliceDialog.value = false
      }
    }, menuSlice)
  } else {
    sfinx.sendMsg('NewSlice', res => {
      if (res.e)
        $q.$notify(res.e)
      else {
        refreshSlices()
        showNewOrEditSliceDialog.value = false
      }
    }, menuSlice)
  }
}

const refreshSlices = (newRoot) => {
  // logger.trace('refreshSlices: selectedSliceId :' + selectedSliceId + ', newRoot: ' + newRoot)
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
       let name = s.name + sfinx.sliceSeparator + s.out_count
       slices.labels.push(name)
       slices.hovertext.push(s.name + (s.description ? (' (' + s.description + ')') : ''))
       slices.ids.push(s.key)
       if (!slices.parents.length) {
         slices.parents.push('')
         dataRoot = s.key
       } else
          slices.parents.push(s.parent)
       slices.customdata.push({
         parent: s.parent,
         out_count: s.out_count,
         description: s.description
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

const newOrEditSlice = edit => {
  sliceDialogTitle.value = edit ? ('Edit ' + menuSlice.name + ' Slice') : ('New Slice in ' + (menuSlice.name ? menuSlice.name : 'Dao'))
  if (!edit) {
    let id = menuSlice.id
    Object.assign(menuSlice, getSliceInitial())
    menuSlice.id = id
  } else if (menuSlice.id == '1')
          return
  showNewOrEditSliceDialog.value = true
  setTimeout(() => {
   sliceName.value.focus()
  }, 50)
}

const plotlyDoubleClick = ev => {
  // // console.log('*** plotlyDoubleClick', currentHoveredSlice)
  // if (currentHoveredSlice.id) {
  //   Object.assign(menuSlice, currentHoveredSlice)
  //   newOrEditSlice(true)
  // }
}

const deleteSlice = mode => {
  // console.log('*** deleteSlice, mode: ' + mode, menuSlice)
  sfinx.sendMsg('DeleteSlice', res => {
  if (res.e)
    $q.$notify(res.e)
   else {
     refreshSlices()
     refreshDocuments() // refresh as documents can become orphaned
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
         refreshSlices()
       }
    })
    showMenu.value = false
    return
  }
  if ($q.$store.movingSlice)
    return
  // console.log('*** moveSlice start', menuSlice)
  refreshSlices('1')
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
  if (!currentHoveredSlice.name) {
    ev.preventDefault()
    return
  }
  // console.log('*** rightClick at', currentHoveredSlice)
}

const plotlyHover = e => {
  let p = e.points[0]
  currentHoveredSlice = {
    name: p.label?.substr(0, p.label.lastIndexOf(sfinx.sliceSeparator)),
    id: p.id,
    description: p.customdata.description,
    customdata: p.customdata
  }
  // logger.trace('*** plotlyHover currentHoveredSlice: ' + logger.json(currentHoveredSlice))
  delete currentHoveredSlice.customdata.description
}

const plotlyUnHover = e => {
  // console.log('*** plotlyUnHover', currentHoveredSlice)
  currentHoveredSlice = {}
}

let selectedSliceId = '1'
let dataRoot

// plotlyData is array so the only way to trigger change is to assign to it
const setRootSlice = root => {
  // logger.trace('setRootSlice: ' + logger.json(root))
  if (root == '')
    root = '1'
  if (plotlyData.value) {
    plotlyData.value = [{ ...plotlyData.value[0], ...{ level: root } }]
  }
}

const refreshDocuments = () => {
  let slice = documentsFilter.slices
  // logger.trace('refreshDocuments: ' + logger.json(slice))
  sfinx.sendMsg('GetDocuments', res => {
    if (res.e)
      $q.$notify(res.e)
    else {
      // console.log('GetDocuments:', res.d)
      documentRows.value = res.d
    }
  }, documentsFilter)
}

const plotlyClick = e => {
  // console.log('plotlyClick', e)
  let p = e.points[0]
  documentsSelected.value = []
  if (keyModifier == 'Shift') {
    // logger.trace('*** Sfinx: selected slice: id: ' + p.id + ', label: [' + p.label + '], parentId: ' + p.customdata.parent)
    if ($q.$store.movingSlice) {
      sfinx.sendMsg('SliceMoveMode', res => {
      if (res.e)
        $q.$notify(res.e)
       else {
         // console.log('*** moveSlice finish', $q.$store.movingSlice)
         $q.$store.movingSlice = null
         refreshSlices()
       }
      }, {
        newParent: { id: p.id }
      })
    } else // no slice move
        documentsFilter.slices = [currentHoveredSlice]
    return false
  } else { // usual click
      // logger.trace('click: selectedSliceId: ' + selectedSliceId + ', dataRoot: ' + dataRoot + ', currentHoveredSlice: ' + logger.json(currentHoveredSlice))
      selectedSliceId =  currentHoveredSlice.id
      if (selectedSliceId != '1') {
        if (selectedSliceId == dataRoot) { // back to parent
          // logger.trace('Back to parent: ' + currentHoveredSlice.customdata.parent)
          refreshSlices(currentHoveredSlice.customdata.parent)
          return false
        }
        if (currentHoveredSlice.customdata.out_count) { // move forward by DB
          // logger.trace('Move forward')
          refreshSlices()
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
  refreshSlices()
  refreshDocuments()
  emitter.on('ReturnToDao', () => {
    // logger.trace('Return to Dao from ' + dataRoot)
    if (dataRoot != '1')
      refreshSlices('1')
    else {
      Object.assign(documentsFilter, getDocumentsFilterDefault())
      setRootSlice()
      refreshDocuments()
    }
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

<style lang="sass">

.main-svg
  background: rgba(100, 100, 100, 0) !important

.sticky-header-table
  /* height or max-height is important */
  height: 310px

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #e0b010

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>
