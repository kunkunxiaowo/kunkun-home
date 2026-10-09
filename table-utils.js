'use strict';
// Stable sorting preserves separate source records, including repeated nicknames.
window.KunkunTables = {
  deletePlayer(data, index) {
    const nickname=this.nicknameKey(data.players[index].nickname);
    data.players.splice(index,1);
    if(nickname&&!data.players.some(p=>this.nicknameKey(p.nickname)===nickname)){
      for(const row of [...data.characters,...(data.bloodbags||[])]){
        if(this.nicknameKey(row.owner)===nickname)row.owner='';
      }
    }
    this.syncNamings(data.players,data.characters);
  },
  bloodLevel(record) {
    const values=['attack','defense','health'].map(field=>record[field]);
    return values.reduce((sum,v)=>sum+Math.round(Number(v)*100),0)/100;
  },
  findPlayers(players, query) {
    const key=this.nicknameKey(query).toLocaleLowerCase();
    if(!key)return [];
    const exact=players.filter(p=>this.nicknameKey(p.nickname).toLocaleLowerCase()===key);
    return exact.length?exact:players.filter(p=>this.nicknameKey(p.nickname).toLocaleLowerCase().includes(key));
  },
  excludeBloodCharacters(characters,bloodbags) {
    const base=value=>this.nicknameKey(value).toLocaleLowerCase().split(/[\\/]/).pop().replace(/\.def$/,'').replace(/\d+p$/,'');
    const names=new Set(bloodbags.map(b=>base(b.name)));
    return characters.filter(c=>!names.has(base(c.name)));
  },
  nicknameKey(value) { return value.trim().normalize('NFKC'); },
  mergePlayers(players) {
    const groups = new Map();
    for (const player of players) {
      const key = this.nicknameKey(player.nickname);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(player);
    }
    const sum = (rows, field) => {
      const values = rows.map(p=>p[field]).filter(v=>v!==null&&v!==undefined&&v!=='');
      return values.length ? values.reduce((total,v)=>total+Math.round(Number(v)*100),0)/100 : null;
    };
    return Array.from(groups.values(), rows => ({...rows[0], fragments:sum(rows,'fragments'),tickets:sum(rows,'tickets'),namings:[...new Set(rows.flatMap(p=>p.namings||[]))],label:[...new Set(rows.map(p=>p.label).filter(Boolean))].join('；'),note:[...new Set(rows.map(p=>p.note).filter(Boolean))].join('\n')}));
  },
  syncNamings(players, characters) {
    const owners=new Map();
    for(const c of characters){const key=this.nicknameKey(c.owner);if(!key)continue;if(!owners.has(key))owners.set(key,new Set());owners.get(key).add(c.name);}
    for(const p of players)p.namings=[...(owners.get(this.nicknameKey(p.nickname))||[])];
  },
  sortRecords(records, field, direction = 'desc') {
    return records.map((record, index) => ({ record, index })).sort((a, b) => {
      const av = a.record[field], bv = b.record[field];
      const am = av === null || av === undefined || av === '';
      const bm = bv === null || bv === undefined || bv === '';
      if (am !== bm) return am ? 1 : -1;
      if (am && bm) return a.index - b.index;
      const difference = direction === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      return difference || a.index - b.index;
    }).map(({ record }) => record);
  }
};
