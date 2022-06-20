# Faraon

 Faraon is the UI client to the Sfinx. The **Sfinx** project is the personal knowledge and data management system (PKDMS) which will offer the most effective way of how the people store, structure and retrieve the information.
Sfinx consist of the cloud and UI part, last is named **Faraon**.

![Faraon](https://github.com/Sfinx/faraon/blob/main/faraon.png)

*Faraon features:*
--------------------------

- UX/GUI based on the Quasar2/Vue3/D3.js next moving to WebGL/VR/AR UI
- manage and structure your personal information (files, documents, music, conversations, projects, knowledges, people, places, events, notes, etc.)
- query/search all stored information with most effective way
- expose the permitted only chains of these structured linked trees to the outside world (blogs, sites, semantic Web)
- ability to use/link/include other Sfinx PKDMS'es to your personal information world using sfinx://user@host:/some_alias URL
- create the simple AI agents to be able to retreieve the needed pieces of informaton and notify/process it under predefined user rules
- set, track and react for the predefined events inside the selected information flow (feeds, reasoning, rules, agents callbacks, API events)
- informational/recommendation/social distributed networks based at the exposed knowledges of the people with extracted semantic
- serve as base Sfinx API example for building third-party applications

This project is my hobby so do not expect the fast releases.

Cloud backend code is not available in source form for now. The limited set of test accounts will be available after v0.1.0 release though

Usage
-----

dev:

```
yarn
make d
```

prod:

```
yarn
make b
```

Next point your browser to sfinx server [ http://dev.sfinx.in/ ]
