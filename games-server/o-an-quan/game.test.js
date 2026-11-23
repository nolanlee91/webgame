const { test }=require("node:test");
const assert=require("node:assert/strict");
const http=require("node:http");
const { createOAnQuanHost }=require("./host");
const { play,newGame }=require("./logic");

test("scores preserve all 50 dân and two quan throughout a game",()=>{
  for (let seed=1;seed<=40;seed++) {
    const g=newGame();
    let over=false;
    for (let step=0;step<1800 && !over;step++) {
      const side=step%2, keys=g.pits.flatMap((n,i)=>n && (side ? i>=7 : i>=1 && i<6) ? [i] : []);
      assert.ok(keys.length);
      seed; 
      const move=play(g,side,keys[(seed*17+step*13)%keys.length],(seed+step*7)%3===0 ? -1 : 1);
      assert.equal(g.pits.reduce((a,b)=>a+b,0)+g.scores[0]+g.scores[1]+10*g.quan.filter(Boolean).length,70);
      over=move.over;
    }
    assert.ok(over);
  }
});

test("chained captures include the occupied quan after a gap",()=>{
  const g=newGame();
  g.pits=[0,1,0,0,4,0,0,0,3,0,0,0];
  const result=play(g,0,1,1);
  assert.equal(result.captured,17);
  assert.equal(g.quan[1],false);
});

test("WebSocket 2v2 turn order, lobby capacity, resume, and stale rejection", {timeout:15000},async()=>{
  const server=http.createServer();
  const host=createOAnQuanHost(server);
  const peers=[];
  const connect=async()=>{
    const ws=new WebSocket("ws://127.0.0.1:"+server.address().port+"/ws/o-an-quan");
    peers.push(ws);
    const queue=[]; let read;
    ws.addEventListener("message",({data})=>{queue.push(JSON.parse(data));read?.();});
    await new Promise((good,bad)=>{ws.addEventListener("open",good,{once:true});ws.addEventListener("error",event=>bad(event.error || new Error(event.message)),{once:true});});
    return {ws,send:(m)=>ws.send(JSON.stringify(m)),async get(t,p=()=>true){
      for (;;) {
        const idx=queue.findIndex(m=>m.t===t&&p(m));
        if(idx>=0)return queue.splice(idx,1)[0];
        await new Promise(r=>{read=r;});
      }
    }};
  };
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  await host.ready;
  try {
    const a=await connect();
    a.send({t:"create",size:4});
    const {code}=await a.get("joined");
    await a.get("state");
    assert.equal(host.publicList()[0].max,4);
    const clients=[a]; const tokens=[];
    for(let i=1;i<4;i++){
      const c=await connect(); clients.push(c);
      c.send({t:"join",code,name:"P"+i});
      tokens[i]=(await c.get("joined")).token;
      await c.get("state");
    }
    assert.deepEqual(host.publicList(),[]);
    a.send({t:"start"});
    for(let i=0;i<4;i++){
      const c=clients[i];
      const {v}=await c.get("state",m=>m.v.phase==="playing"&&m.v.revision===i+1);
      assert.equal(v.turn,i);
      const cell=v.game.pits.findIndex((n,k)=>n && (i%2 ? k>=7 : k>=1&&k<6));
      if(i===1){
        c.send({t:"move",cell,dir:1,revision:v.revision-1});
        assert.equal((await c.get("err")).code,"turn");
      }
      c.send({t:"move",cell,dir:1,revision:v.revision});
    }
    const round=await a.get("state",m=>m.v.revision===5);
    assert.equal(round.v.turn,0);
    clients[3].ws.close();
    await a.get("state",m=>m.v.players[3]?.connected===false);
    const resumed=await connect();
    resumed.send({t:"resume",code,token:tokens[3]});
    await resumed.get("joined");
    const st=await resumed.get("state");
    assert.equal(st.v.you,3);
    assert.equal(st.v.turn,0);
    resumed.send({t:"leave"});
    assert.equal((await a.get("state",m=>m.v.phase==="over")).v.winner,0);
    const solo=await connect();
    solo.send({t:"create",size:2,public:false});
    const duo=await solo.get("joined");
    const b=await connect();
    b.send({t:"join",code:duo.code});
    await b.get("joined");
    assert.deepEqual(host.publicList(),[]);
    solo.send({t:"start"});
    const final=await solo.get("state",m=>m.v.phase==="playing");
    assert.equal(final.v.max,2);
  } finally {
    host.close();
    for(const ws of peers)ws.close();
    await new Promise(r=>server.close(r));
  }
});

