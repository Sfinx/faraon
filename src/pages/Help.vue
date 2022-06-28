
<template>
  <q-page class="q-pa-xl">
    <q-card class="q-dialog-plugin" style="user-select: none; height: 100%; min-width: 100%;">
      <q-toolbar class="bg-primary glossy text-white">
        <q-toolbar-title>Short help</q-toolbar-title>
      </q-toolbar>
      <div class="q-px-md q-pb-md">
        <h6>
        <p>Digit after vertical mark in slice browser show the total slices in lower hierarchy as default shown slices depth is 3 but total hierarchy depth is unlimited</p>
        <p>Selecting slice in document browser is performed with holding Shift & click in slice browser</p>
        <p>Add new slice to selection in document browser is performed with holding Ctrl & click in slice browser</p>
        <p>Double click in documents browser to view the document</p>
        <p>ToDo's items are draggable in edit mode</p>
        <p>To receive telegram notifications:
          <ul>
            <li>Find in telegram @botfather</li>
            <li>Issue command /newbot</li>
            <li>Answer for example 'Own Sfinx' as a name for bot</li>
            <li>Answer for example 'OwnSfinxBot' as username for bot</li>
            <li>Remember telegram token</li>
            <li>Issue /setuserpic if you want to set the bot avatar</li>
            <li>Go to Sfinx profile and save the telegram token</li>
            <li>Go to telegram, find bot's username and activate bot by pressing 'Start'</li>
            <li>Sfinx bot will answer with greeting. And you will be able receive notification from Sfinx (events, i.e.)</li>
          </ul>
        </p>
        <p>When slice is trimmed then all its child slices moved to its parent. The slice will be removed from the list of slices for documents that had this slice in the slices list</p>
        <p>When slice is removed recursevly then all the child slices will be removed too. The slice will be removed from the list of slices for documents that had this slice in the slices list.
          Part of document can became orphaned is deleted slice was the only slice the document belong to</p>
      </h6>
      </div>
    </q-card>
  </q-page>
</template>
<script setup/>
