
<template>
  <q-page class="flex flex-center" style="user-select: none;">

    <q-resize-observer @resize="onResize"/>

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
          <q-separator/>
            <q-item v-if="!$q.$store.movingSlice" clickable>
              <q-item-section>Add Document</q-item-section>
              <q-item-section side>
                <q-icon name="keyboard_arrow_right"/>
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
    <div class="q-pa-md" style="z-index: 10; position: absolute;top: 0; left: 0; height: 100%; width: 40%;">
      <q-card class="q-dialog-plugin" style="user-select: none; height: 100%; min-width: 95%;">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>{{ documentsTitle }}</q-toolbar-title>
        </q-toolbar>
        <search-slice ref="searchSliceRef" :filter="documentsFilter" :selected="documentsSelected" style="height: 6%" class="q-ma-sm"/>
        <q-input ref="documentsSearchRef" v-model="documentsSearchFilter.search" dense outlined label-color="black" label="Documents Search" style="height: 6%" class="q-ma-sm">
          <q-icon v-if="documentsSearchFilter.search !== ''" name="clear" class="q-mt-md cursor-pointer" @click="resetdocumentsSearchFilter" />
        </q-input>
          <q-table
            dense
            class="sticky-header-table bg-amber-5"
            style="min-height: 68%;"
            ref="documentsTableRef"
            :filter="documentsSearchFilter"
            :filter-method="documentsSearchFilterDocs"
            :rows="documentRows"
            :columns="documentColumns"
            selection="multiple"
            :selected="documentsSelected"
            @selection="onDocumentSelection"
            :selected-rows-label="getDocumentSelectedString"
            :rows-per-page-options="[0]"
            row-key="_key"
            @row-click="selectDocument"
            @row-dblclick="(evt, document, index) => Object.assign(viewDocumentDialog, { on: true, document, hidden: true })"
            no-data-label="No documents yet"
            :no-results-label="getDocumentsResultLabel()"
          >
            <template v-slot:body-cell-type="props" >
              <q-td class="text-left">
                <!-- <q-icon name="xyz" class="q-mr-md"/> -->
                <q-badge
                  class="q-mr-md"
                  style="height: 25px; width: 20px"
                  color="green"
                  :label="props.value[0].toUpperCase()"
                ></q-badge>
              </q-td>
            </template>
          </q-table>
        <q-card-actions class="q-mt-xs" align="between">
          <div>
            <q-btn-dropdown class="bg-secondary text-white" glossy label="Filter">
              <q-list style="min-width: 120px">
                <q-item>
                  <div class="column">
                    <q-radio v-close-popup v-model="documentsFilter.category" val="all" label="All Documents" />
                    <q-radio v-close-popup v-model="documentsFilter.category" val="orphans" label="Orphans only" />
                    <q-radio v-close-popup v-model="documentsFilter.category" val="recursively" label="Recursively" />
                    <q-radio v-close-popup v-model="documentsFilter.category" val="inslice" label="In slice" />
                    <q-separator/>
                    <q-btn-dropdown unelevated dense flat label="By Type">
                      <q-list style="min-width: 120px">
                        <q-item>
                          <div class="column" >
                            <q-toggle v-for="docType in documentTypes.slice().reverse()" v-model="documentsFilter.types[docType.toLowerCase()]" :label="docType"/>
                            <q-item v-close-popup style="user-select: none;" @click="documentsFilter.types.fill(false)" clickable>All types</q-item>
                          </div>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
          <div class="q-gutter-sm">
            <q-btn class="bg-red text-white" glossy label="Delete" @click="deleteTheDocument"/>
            <q-btn class="bg-secondary text-white" glossy label="Edit" @click="editDocument()"/>
            <q-btn class="bg-secondary text-white" glossy label="New">
              <q-menu>
                <q-list v-for="docType in documentTypes.slice().reverse()" style="min-width: 120px">
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
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-toolbar>
        <q-card-actions class="q-ma-sm row">
          <q-btn class="bg-secondary text-white" glossy label="Return to Dao" @click="selectSliceRef.toDao()"/>
          <search-slice @selected="sliceSelected" style="width: 79%;height: 6%" class="q-ml-sm"/>
        </q-card-actions>
        <q-card-section class="col items-center">
          <SelectSlice ref="selectSliceRef" :layout="selectSliceLayout" :maxDepth="maxDepth"  :selected="sliceSelected"/>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="newOrEditDocumentDialog.on" :hidden="newOrEditDocumentDialog.hidden" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="user-select: none; min-width: fit-content; min-height: 40%">
        <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>{{ newOrEditDocumentDialog.title }}</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-toolbar>
        <q-card-section class="items-center q-mx-xs q-mt-xs" style="min-height: fit-content;">
            <process-document ref="processDocumentRef" :type="newOrEditDocumentDialog.type" op="NewOrEdit" :data="newOrEditDocumentDialog"
              @error="e => { $q.$enotify('NewOrEditDocument Error: ' + e); newOrEditDocumentDialog.on = false }" @done="newOrEditDocumentDone" @ready="newOrEditDocumentDialog.hidden = false"
              @update="doc => newOrEditDocumentDialog.document.data = doc"/>
        </q-card-section>
        <q-card-section class="dense items-center q-pb-xs">
          <div @click="showSliceSelectionDialog = true">
          <q-select
            filled
            v-model="newOrEditDocumentDialog.slices"
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
                @remove="scope.removeAtIndex(scope.index)"
                @mouseenter="updateFullSlicePath(scope.opt)"
                :tabindex="scope.tabindex"
                class="q-mr-xs"
              >
                <q-tooltip anchor="top right" :offset="[30, 30]" >{{ fullSlicePath }}</q-tooltip>
                {{ scope.opt.name }}
              </q-chip>
            </template>
          </q-select>
        </div>
        </q-card-section>
        <q-card-actions class="dense q-mb-sm q-mx-sm" align="between">
          <div class="row">
            <q-btn class="bg-secondary q-mr-lg text-white" glossy label="Clear Slices" @click="newOrEditDocumentClearSlices()"/>
            <q-select style="min-width: 120px" dense v-model="newOrEditDocumentDialog.encrypted" :options="encryptOptions" label="Encrypt" />
          </div>
          <div>
            <q-btn class="bg-secondary text-white" glossy label="Done" @click="processDocumentRef.processDocument()"/>
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="viewDocumentDialog.on" :hidden="viewDocumentDialog.hidden" persistent transition="scale">
      <q-card class="q-dialog-plugin" style="min-width: 35vw;">
        <q-toolbar style="user-select: none;" class="bg-primary glossy text-white">
          <q-toolbar-title>{{ 'View ' + sfinx.getFullDocumentType(viewDocumentDialog.document) +' \'' + viewDocumentDialog.document.data.name + '\'' }}</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-toolbar>
        <q-card-section class="q-mx-xs q-mt-xs" style="min-height: fit-content; padding: 6px">
            <process-document :type="viewDocumentDialog.document.type" op="View" :data="viewDocumentDialog.document.data" @update="viewDocumentUpdate"
              @error="e => { $q.$enotify('ViewDocument Error: ' + e); viewDocumentDialog.on = false }" @ready="viewDocumentDialog.hidden = false"/>
        </q-card-section>
        <q-card-section class="dense" style="padding: 3px">
          <q-select
            filled
            v-model="viewDocumentDialog.document.slices"
            multiple
            dense
            use-chips
            stack-label
            label="Slices"
            class="outline rounded-borders q-mx-sm"
            style="user-select: none; outline-width: thin"
          >
            <template v-slot:selected-item="scope">
              <q-chip
                dense
                :tabindex="scope.tabindex"
                class="q-mr-xs"
                @mouseenter="updateFullSlicePath(scope.opt)"
              >
                <q-tooltip anchor="top right" :offset="[30, 30]" >{{ fullSlicePath }}</q-tooltip>
              <!-- color="white"
              text-color="secondary" -->
                {{ scope.opt.name }}
              </q-chip>
            </template>
          </q-select>
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
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-toolbar>
        <q-card-section class="col items-center">
          <form>
            <q-input v-model="menuSlice.name" outlined label-color="black" label="Slice Name" ref="sliceNameRef" @keydown.enter.prevent="sliceDescriptionRef.focus()" class="q-mb-sm"/>
            <q-input v-model="menuSlice.description" outlined label-color="black" label="Slice Description" ref="sliceDescriptionRef" @keydown.enter.prevent="sliceProcess" class="q-mb-sm"/>
          </form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn class="bg-primary text-white" glossy label="Done" @click="sliceProcess()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteConfirm.on">
      <q-card>
        <q-card-section>
          <div class="q-ml-none text-h6">{{ deleteConfirm.title }}</div>
        </q-card-section>
        <q-card-section class="q-px-md q-pt-none">{{ deleteConfirm.text }}</q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Yes" @click="deleteConfirm.ok"/>
          <q-btn flat label="Close" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>

import { ref, reactive, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from 'vue'
import sfinx, {_1_SECOND } from '@/sfinx'
import { useQuasar } from 'quasar'
import logger from '@/logger'
import emitter from 'tiny-emitter/instance'
import { format } from 'fecha'

// components
const Plotly = defineAsyncComponent(() => import('components/Plotly.vue'))
const SelectSlice = defineAsyncComponent(() => import('components/SelectSlice.vue'))
const SearchSlice = defineAsyncComponent(() => import('components/SearchSlice.vue'))
const ProcessDocument = defineAsyncComponent(() => import('components/ProcessDocument.vue'))

const $q = useQuasar()

const documentTypes = ['Note', 'File', 'Event', 'Todo']

const fullSlicePath = ref(null)
const updateFullSlicePath = async (s) => fullSlicePath.value = await sfinx.showFullSlicePath(s)

const getDocumentsResultLabel = () => {
  let l = 'No documents found for "'
  switch (documentsFilter.category) {
    case 'inslice':
      l += 'In Slice'
      break
    case 'orphans':
      l += 'Orphans Only'
      break
    case 'all':
      l += 'All Documents'
      break
    case 'recursively':
      l += 'Recursively'
      break
    default:
      break
  }
  l += '" filter'
  return l
}

const stripHTML = (html) => {
  let doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

const maxColumnWidth = 9

const documentColumns = [
  { name: 'type', align: 'left', label: 'Type', field: 'type', sortable: true, headerStyle: "max-width: 40px" },
  { name: 'name', align: 'left', label: 'Name', field: r => r.data.ciphertext ? ((r.encrypt == 1 ? 'M' : 'U') + '🔒') : r.data.name, sortable: true, format: (v, r) => {
      if (v.length > maxColumnWidth)
        return v.substring(0, maxColumnWidth) + '..'
      return v
    }
  },
  { name: 'description', align: 'center', label: 'Description', field: r => r.data.ciphertext ? ((r.encrypt == 1 ? 'M' : 'U') + '🔒') : r.data.description, sortable: true, format: (v, r) => {
      v = stripHTML(v)
      if (v.length > maxColumnWidth)
        return v.substring(0, maxColumnWidth) + '..'
      return v
    }
  },
  { name: 'ctime', align: 'center', label: 'Created', field: 'ctime', sortable: true, format: (val, row) => {
      let d = new Date(val * _1_SECOND)
      return format(d, 'DD/MM/YY HH:mm:ss')
    }
  }
]

const maxDepth = 3
let selectedSliceId = '1'
let dataRoot
let currentHoveredSlice = {}

const documentlastIndex = ref(null)
const plotlyData = ref(null)
const showSliceSelectionDialog = ref(false)
const showMenu = ref(false)
const showNewOrEditSliceDialog = ref(false)
const sliceDialogTitle = ref('')
const documentRows = ref([])
const documentsSelected = ref([])
const menuSlice = reactive(getSliceDefaults())
let viewDocumentDialog = reactive({ on: false, document: null, hidden: true })
let documentsSearchFilter = reactive({ search: '' })

const getdocumentsFilterDefaults = () => {
  return {
    category: 'inslice',
    types: Object.fromEntries(documentTypes.map(v => [v.toLocaleLowerCase(), false])),
    slices: [{ name: 'Dao', id: '1' }]
  }
}

let documentsFilter = reactive(getdocumentsFilterDefaults())

const encryptOptions = [
  {
    label: 'None',
    value: 0
  },
  {
    label:'By Master Key',
    value: 1
  },
  {
    label: 'By Unique Key',
    value: 2
  }
]

// refs
const selectSliceRef = ref(null)
const processDocumentRef = ref(null)
const sliceNameRef = ref(null)
const sliceDescriptionRef = ref(null)
const plotlyRef = ref(null)
const documentsTableRef = ref(null)
const documentsSearchRef = ref(null)
const searchSliceRef = ref(null)

const documentsSearchFilterDocs = (rows, fo, cols, getCellValue) => {
  let search = fo.search ? fo.search.toLowerCase() : ''
  return rows.filter(row => cols.some(col => {
    if (row.data.ciphertext) // show locked documents by default if nothing entered in search
      return documentsSearchFilter.search.length ? false : true
    const name = row.data.name.length ? row.data.name.toLowerCase() : ''
    const description = row.data.description.length ? row.data.description.toLowerCase() : ''
    if ((name.indexOf(search) == -1) && (description.indexOf(search) == -1))
      return false
    return true
  }))
}

const resetdocumentsSearchFilter = () => {
  documentsSearchFilter.search = ''
  documentsSearchRef.value.focus()
}

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

const deleteTheDocument = () => {
  if (documentsSelected.value?.length < 1)
    return
  let doc = documentsSelected.value[0]
  let msg = 'Are you sure that want to delete ' + (documentsSelected.value.length > 1 ? (documentsSelected.value.length + ' documents ?') : ('the ' + doc.type + ' \'' + doc.name + '\' ?'))
  deleteConfirm.ask('Confirm Document' + (documentsSelected.value.length > 1 ? 's' : '') + ' Deletion', msg, () => deleteDocument())
}

const deleteDocument = () => {
  let docs = []
  for (let d of documentsSelected.value) {
    if (d.type == 'file' && d.data.ciphertext) {
      $q.$enotify('Encrypted files must be unlocked before deletion')
      return
    }
    docs.push(d._key)
  }
  sfinx.sendMsg('DeleteDocument', res => {
    if (res.e)
      $q.$enotify(res.e)
    else {
      refreshDocuments()
      $q.$store.total_documents -= docs.length
      documentsSelected.value.length = 0
    }
  }, docs)
}

let newOrEditDocumentDialog = reactive({
  on: false,
  type: null,
  edit: false,
  document: null,
  title: '',
  hidden: true
})

const editDocument = (doc) => {
  if (!doc) {
    if (!documentsSelected.value.length || (documentsSelected.value.length > 1))
      return
    doc = documentsSelected.value[0]
  }
  newOrEditDocument(sfinx.getFullDocumentType(doc), true, doc)
}

const newOrEditDocument = (type, edit, doc) => {
  let menuSlices = [{ id: menuSlice.id, name: menuSlice.name  }]
  if (!doc)
    documentsFilter.slices = menuSlices
  let document = doc ?? { slices: menuSlices }
  let inSlices = getSlicesNames(document)
  newOrEditDocumentDialog.title = edit ? ('Edit ' + (documentsFilter.category == 'orphans' ? 'Orphan ' : '') + '\'' + document.name + '\' ' + type) : ('New ' + type)
  if (documentsFilter.category != 'orphans' || !edit)
    newOrEditDocumentDialog.title += (' in [' + inSlices + ']')
  // remove reactivity from slices so no GetDocuments will be triggered
  let slices = document.slices.map(s => Object.assign({ }, s))
  let encrypted = document.encrypt ? encryptOptions[document.encrypt] : encryptOptions[0]
  if (!edit)
    Object.assign(newOrEditDocumentDialog, { on: true, hidden: true, type, edit, slices, encrypted })
  else
    Object.assign(newOrEditDocumentDialog, { on: true, hidden: true, type, edit, slices, encrypted, document })
}

const newOrEditDocumentDone = async (doc) => {
  // remove unneeded data from document object
  delete doc.slices
  let data = doc.data
  if (newOrEditDocumentDialog.encrypted.value !== 0) {
    let key, aad
    if (newOrEditDocumentDialog.encrypted.value == 1)
      key = await sfinx.getMasterKey()
    else {
      key = await sfinx.passPrompt('Unique Password', 'Enter the Unique Password', 'password')
      aad = await sfinx.passPrompt('AAD for ' + newOrEditDocumentDialog.title, 'Enter the Hint for document encrypted by Unique Password')
      if (!aad.k.length)
        return $q.$enotify('Invalid AAD')
    }
    if (key.e)
      return $q.$enotify(key.e)
    data = await sfinx.encrypt(logger.json(doc.data), key.k, aad?.k)
  }
  let newDoc = Object.assign({}, { ...doc, ...{ data }, type: newOrEditDocumentDialog.type.toLowerCase(), slices: newOrEditDocumentDialog.slices, _key: newOrEditDocumentDialog.edit ? newOrEditDocumentDialog.document._key : undefined })
  const ok = () => {
    refreshDocuments()
    documentsSelected.value = []
    newOrEditDocumentDialog.on = false
    $q.$store.total_documents++
  }
  if (newOrEditDocumentDialog.edit) {
    sfinx.sendMsg('EditDocument', res => {
      if (res.e)
        $q.$enotify(res.e)
      else
        ok()
    }, newDoc)
  } else {
    sfinx.sendMsg('NewDocument', res => {
      if (res.e)
        $q.$enotify(res.e)
      else
        ok()
    }, newDoc)
  }
}

const viewDocumentUpdate = (doc, decrypt) => {
  if (decrypt) // replace decrypted with master key
    viewDocumentDialog.document.data = doc
  else
    sfinx.sendMsg('EditDocument', res => {
      if (res.e)
        $q.$enotify(res.e)
    }, { data: doc, _key: viewDocumentDialog.document._key })
}

const documentPresent = (row) => {
  for (let [idx, r] of documentsSelected.value?.entries()) {
    if (r._key == row._key)
      return idx
  }
  return -1
}

const selectDocument = (evt, row, index) => {
  const selectedIndex = documentPresent(row)
  if (selectedIndex > -1)
    documentsSelected.value = documentsSelected.value.slice(0, selectedIndex).concat(documentsSelected.value.slice(selectedIndex + 1))
  else
    documentsSelected.value = documentsSelected.value.concat(row)
}

const getDocumentSelectedString = () => documentsSelected.value.length === 0 ? '' : `${documentsSelected.value.length} record${documentsSelected.value.length > 1 ? 's' : ''} selected of ${documentRows.value.length}`

const onDocumentSelection = ({ rows, added, evt }) => {

  if (rows.length === 0 || documentsTableRef.value === void 0)
   return

  const row = rows[0]
  const filteredSortedRows = documentsTableRef.value.filteredSortedRows
  const rowIndex = filteredSortedRows.indexOf(row) // documentPresent(row) ??
  const localLastIndex = documentlastIndex.value

  documentlastIndex.value = rowIndex
  document.getSelection().removeAllRanges()

  if ($q.platform.is.mobile === true)
    evt = { ctrlKey: true }
  else if (evt !== Object(evt) || (evt.shiftKey !== true && evt.ctrlKey !== true))
    return (documentsSelected.value = added === true ? rows : [])

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

  if (localLastIndex === null || evt.shiftKey !== true)
    return operateSelection(row)

  const from = localLastIndex < rowIndex ? localLastIndex : rowIndex
  const to = localLastIndex < rowIndex ? rowIndex : localLastIndex
  for (let i = from; i <= to; i += 1)
    operateSelection(filteredSortedRows[i])
}

function getSliceDefaults() {
  return {
    name: '',
    description: '',
    id: 0,
    customdata: { }
  }
}

const newOrEditDocumentClearSlices = () => newOrEditDocumentDialog.slices.length = 0

function slicePresent(slice, a) {
  for (let s of a.slices) {
    if (s.id == slice.id)
      return true
  }
  return false
}

const sliceSelected = slice => {
  let name = slice.name ? slice.name : slice.label.substring(0, slice.label.lastIndexOf(sfinx.sliceSeparator))
  // no sense to have several instances of the same slice
  if (slicePresent(slice, newOrEditDocumentDialog))
    return $q.$enotify('Slice \'' + name + '\' already assigned')
  newOrEditDocumentDialog.slices.push({ name, id: slice.id })
  showSliceSelectionDialog.value = false
}

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

watch(documentsFilter, n => refreshDocuments())

watch(() => documentsSearchFilter.search, n => documentsSelected.value.length = 0) // unselect docs if we are changing filter

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

const documentsTitle = computed(() => documentsFilter.category == 'all' ? 'All Documents' : (documentsFilter.category == 'orphans' ? 'Orphan Documents' : ('Documents ' + (documentsFilter.category == 'recursively' ? 'recursively ' : '') +
  'in [' + getSlicesNames(documentsFilter) + ']')))

const getSlicesNames = d => {
  let label = d.slices.length ? '' : 'Dao'
  for (let s of d.slices) {
    if (label !== '')
      label += ', '
    label += s.name
  }
  return label
}

const sliceProcess = () => {
  if (sliceDialogTitle.value.startsWith('Edit')) {
    sfinx.sendMsg('EditSlice', res => {
      if (res.e)
        $q.$enotify(res.e)
      else {
        refreshSlices()
        showNewOrEditSliceDialog.value = false
      }
    }, menuSlice)
  } else {
    sfinx.sendMsg('NewSlice', res => {
      if (res.e)
        $q.$enotify(res.e)
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
    $q.$enotify(res.e)
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
    Object.assign(menuSlice, getSliceDefaults())
    menuSlice.id = id
  } else if (menuSlice.id == '1')
           return
  showNewOrEditSliceDialog.value = true
  setTimeout(() => sliceNameRef.value.focus(), 50)
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
    $q.$enotify(res.e)
   else {
     for (const [idx, s] of documentsFilter.slices.entries()) {
      if (s.id === menuSlice.id) {
          if (documentsFilter.slices.length > 1)
            refreshSlices()
          else
            refreshSlices('1')
          if (documentsFilter.slices.length > 1)
            documentsFilter.slices.splice(idx, 1)
          else
            Object.assign(documentsFilter, getdocumentsFilterDefaults())
          return // prevent double refreshDocuments() because of documentsFilter watch
        }
     }
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
        $q.$enotify(res.e)
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
      $q.$enotify(res.e)
    else {
      showMenu.value = false
      $q.$store.movingSlice = menuSlice
    }
  }, {
    movingSlice: menuSlice
  })
}

const rightClick = ev => {
  if (!currentHoveredSlice.name)
    return ev.preventDefault()
  // console.log('*** rightClick at', currentHoveredSlice)
}

const plotlyHover = e => {
  let p = e.points[0]
  currentHoveredSlice = {
    name: p.label?.substring(0, p.label.lastIndexOf(sfinx.sliceSeparator)),
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
  // logger.trace('refreshDocuments: ' + logger.json(documentsFilter.slices))
  let filter = { category: documentsFilter.category }
  filter.slices = documentsFilter.slices.map(s => ({ id: s.id }))
  filter.types = []
  for (const [k, v] of Object.entries(documentsFilter.types)) {
    if (v)
      filter.types.push(k)
  }
  // if (!filter.slices.length && slicesSearch.value.length)
  //   return documentRows.value = []
  sfinx.sendMsg('GetDocuments', async res => {
    if (res.e)
      $q.$enotify(res.e)
    else {
      $q.$store.inslices_documents = res.d.length
      for (let d of res.d) {
        d.encrypt = 0
        if (d.data.ciphertext) {
          d.encrypt = 1
          if (d.data.aad) { // unique key
            d.encrypt = 2
            continue
          } else if (sfinx.masterKey != '') { // do not ask the master key each refresh time, '' means skip for now
              let key = await sfinx.getMasterKey()
              if (key.e)
                $q.$enotify(key.e)
              else {
                let data = await sfinx.decrypt(d.data, key.k)
                if (data.e)
                  $q.$enotify('GetDocuments: ' + data.e)
                else
                  d.data = logger.parse(data.d)
              }
          }
        }
      }
      documentRows.value = res.d
    }
  }, filter)
}

const plotlyClick = e => {
  // console.log('plotlyClick', e)
  let p = e.points[0]
  documentsSelected.value.length = 0
  if (keyModifier == 'Control') { // add slice to filter
    if (!$q.$store.movingSlice) {
      if (slicePresent(currentHoveredSlice, documentsFilter))
        $q.$enotify('Slice \'' + currentHoveredSlice.name + '\' already present')
      else
        documentsFilter.slices.push(currentHoveredSlice)
      return false
    }
  } else if (keyModifier == 'Shift') {
    // logger.trace('*** Sfinx: selected slice: id: ' + p.id + ', label: [' + p.label + '], parentId: ' + p.customdata.parent)
    if ($q.$store.movingSlice) {
      sfinx.sendMsg('SliceMoveMode', res => {
        if (res.e)
          $q.$enotify(res.e)
        else {
          // console.log('*** moveSlice finish', $q.$store.movingSlice)
          $q.$store.movingSlice = null
          refreshSlices()
        }
      }, {
        newParent: { id: p.id }
      })
    } else { // no slice move just slice select
        documentsFilter.slices = [currentHoveredSlice]
        searchSliceRef.value.clear()
    }
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
  margin: {l: 500, r: 0, b: 40, t: 40},
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
  emitter.on('ReturnToDao', () => {
    // logger.trace('Return to Dao from ' + dataRoot)
    if (dataRoot != '1')
      refreshSlices('1')
    else {
      Object.assign(documentsFilter, getdocumentsFilterDefaults())
      setRootSlice()
      refreshDocuments()
    }
  })
})

let keyModifier = null
const keyDown = e => keyModifier = e.key
const keyUp = e =>  keyModifier = null

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
