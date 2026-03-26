| Step | What | Where | Manual? |
|---|---|---|---|
| ① | Schema definition | admin/app/collections/<name>.js | Yes |
| ② | Boot loader registration | admin/index.html | Yes |
| ③ | Server path + JSON file | server/server.js + server/data | Yes |
| ④ | Engine: validate + build | admin/app/collections.js -> admin/app/collections-init.js | Auto |
| ⑤ | UI: Nav, List, Editor | admin/app/App.js -> ListPage / EditorPage | Auto |
| ⑥ | API: CRUD endpoints | Generic routes in server/server.js | Auto |
| ⑦ | Data persistence | JSON files in server/data | Auto |