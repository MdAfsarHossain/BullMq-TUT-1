# BullMQ Tut 1

## Worker Workflow

1. First add job to the queue

```js
index -> jobController -> queueConfig -> emailWorker
```

```js
index -> jobController -> queueConfig -> reportWorker
```

```js
npm run dev // Run the main server
npm run worker:email // Run email worker
npm run worker:report // Run report worker
```
