import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

// Exercise the browser's real functions with small DOM/storage seams, as in formula-tests.
function functions(file, names) {
  const lines = fs.readFileSync(new URL(`../assets/${file}`, import.meta.url), 'utf8').split(/\r?\n/);
  return names.map(name => {
    const line = lines.find(line => line.startsWith(`function ${name}(`));
    assert.ok(line, `Missing function ${name}`);
    return line;
  }).join('\n');
}
function run(context, source) { return vm.runInContext(source, context); }
function wb() {
  const hint = {};
  const c = {rows: [], rowsHost: {}, envelope: [], envelopeInput: {value: ''},
    scenarioName: {}, profileSelect: {}, KEY_SCEN: 'scenarios',
    qs: s => s === '#wbScenarioDialog' ? {close() {}} : hint, calculate() {}, toast() {}};
  vm.createContext(c);
  run(c, functions('weight-balance.js', ['readDOM', 'parseEnvelope', 'openScenario', 'pointInPolygon', 'envelopeState']));
  return {c, hint};
}

test('POH single-family trace rejects unmatched operating conditions and clears a previous result', () => {
  const fields = {'#pcsInputX': {value: '50'}, '#pcsFamily': {value: '2000'}, '#pcsYUnit': {value: 'ft'}};
  const c = {state: {xCal: [{x:0,y:100,v:0},{x:100,y:100,v:100}],
    yCal: [{x:0,y:100,v:0},{x:0,y:0,v:1000}],
    curves: [{value:2000,points:[{x:0,y:90},{x:100,y:10}]}]},
    $: s => fields[s], draw() {}, setResult(t) { c.result = t; }};
  vm.createContext(c);
  run(c, functions('poh-chart-studio.js', ['cal', 'interp', 'calculate']));
  run(c, 'calculate()');
  assert.equal(c.state.solution.y, 500);
  for (const value of ['3000', '1000']) {
    fields['#pcsFamily'].value = value;
    run(c, 'calculate()');
    assert.equal(c.state.solution, null);
    assert.match(c.result, /outside the traced range/);
  }
  c.state.curves.push({value:4000,points:[{x:0,y:70},{x:100,y:10}]});
  fields['#pcsFamily'].value = '3000';
  run(c, 'calculate()');
  assert.equal(c.state.solution.y, 550, 'supported two-family interpolation remains available');
});

test('W&B rejects the entire malformed envelope, including missing and extra columns', () => {
  const {c, hint} = wb();
  const valid = '35,1500\n35,2400\n40,2400\n40,2000\n47,2000\n47,1500';
  c.envelopeInput.value = valid;
  run(c, 'parseEnvelope(false)');
  assert.equal(c.envelope.length, 6);
  assert.equal(run(c, 'pointInPolygon(42,2200,envelope)'), false);
  for (const bad of ['40,invalid', ',2000', '40,', '40', '40,2000,extra']) {
    c.envelopeInput.value = valid.replace('40,2000', bad);
    run(c, 'parseEnvelope(false)');
    assert.equal(c.envelope.length, 0, `must not use partial boundary for ${bad}`);
    assert.match(hint.textContent, /not applied/i);
    c.status = {dataset: {}};
    run(c, 'envelopeState({ok:true,cg:42,W:2200},status)');
    assert.notEqual(c.status.dataset.state, 'inside');
  }
  c.envelopeInput.value = '\n' + valid + '\n';
  run(c, 'parseEnvelope(false)');
  assert.equal(c.envelope.length, 6, 'blank separator lines are harmless');
  c.envelopeInput.value = '';
  run(c, 'parseEnvelope(false)');
  assert.equal(c.envelope.length, 0);
});

test('W&B opening a saved scenario renders saved weights before any DOM read or autosave', () => {
  const {c} = wb();
  const saved = {id:'saved', name:'Saved', rows:[{id:'fuel',name:'Fuel',dep:'240',ldg:'120',arm:'48'}],envelopeText:''};
  let fields = Object.entries({...saved.rows[0],dep:'300',ldg:'180'}).filter(([k]) => k !== 'id')
    .map(([k,value]) => ({dataset:{k},value}));
  c.loadJSON = () => [saved];
  c.uid = () => 'new';
  c.qsa = selector => selector === '.wb-row' ? [{dataset:{id:'fuel'}}] : fields;
  c.calculate = () => run(c, 'readDOM()');
  c.renderRows = () => {
    fields = Object.entries(c.rows[0]).filter(([k]) => k !== 'id').map(([k,value]) => ({dataset:{k},value}));
    c.calculate();
  };
  c.scheduleSave = () => { run(c, 'readDOM()'); c.autosaved = JSON.parse(JSON.stringify(c.rows)); };
  run(c, "openScenario('saved')");
  assert.equal(c.rows[0].dep, '240');
  assert.equal(c.rows[0].ldg, '120');
  assert.equal(c.autosaved[0].dep, '240');
  assert.equal(fields.find(f => f.dataset.k === 'dep').value, '240');
});
