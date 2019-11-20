
const index = require('../index');
const assert = require('assert');
const daskeyboardApplet = require('daskeyboard-applet')

// store the fake response representing the list of assignments comming from the cloud
let fakeResponse = [];

/**
 * Build the app with the get Assignments method that returnns a fake response
 */
function buildAppWithFakeResponse() {
  let app = new index.QBamzooka();
  app.getAssignments = async function () {
    return new Promise((resolve, reject) => {
      resolve(new index.BamzookaAssignmentsGroup(fakeResponse));
    });
  };
  return app;
};

/**
 * Returns a date that is far from today's date
 */
function getFarDate() {
  const today = new Date(Date.now());
  const farDate = new Date();
  farDate.setDate(today.getDate() + 5);
  return farDate;
}

/**
 * Returns a date that is between today and 2 days later than today
 */
function getDueSoonDate() {
  const today = new Date(Date.now());
  const nowPlus1Day = new Date();
  nowPlus1Day.setDate(today.getDate() + 1);
  return nowPlus1Day;
}

/**
 * Returns a Date that is before today's date
 */
function getLateDate() {
  const today = new Date(Date.now());
  const late = new Date();
  late.setDate(today.getDate() - 1);
  return late;
}

describe('BamzookaAssignmentsGroup', () => {
  it('should count the dates correctly', () => {
    const assignments = [
      { due_at: getLateDate().toISOString() },
      { due_at: getFarDate().toISOString() },
      { due_at: getDueSoonDate().toISOString() },
      { due_at: null }
    ];
    const group = new index.BamzookaAssignmentsGroup(assignments);
    assert.equal(group.lateDue, 1, `Late due is wrong`);
    assert.equal(group.dueSoon, 1, `Due soon is wrong`);
    assert.equal(group.total, 4, `Total is wrong`)
  });
});

describe('QBamzooka', async () => {
  it('should get a blink red if there is an assignment due late', async function () {
    fakeResponse = [
      { due_at: getLateDate().toISOString() }
    ];
    const app = buildAppWithFakeResponse();
    return app.run().then(signal => {
      assert.ok(signal);
      assert.equal('#FF0000', signal.points[0][0].color);
      assert.equal(daskeyboardApplet.Effects.BLINK, signal.points[0][0].effect);
    }).catch(err => {
      assert.fail(err);
    });
  });

  it('should get a set color orange if there is a due soon', async () => {
    fakeResponse = [
      { due_at: getDueSoonDate().toISOString() }
    ];
    const app = buildAppWithFakeResponse();
    return app.run().then(signal => {
      assert.ok(signal);
      assert.equal(signal.points[0][0].color, '#FFA500');
      assert.equal(daskeyboardApplet.Effects.SET_COLOR, signal.points[0][0].effect);
    }).catch(err => {
      assert.fail(err);
    });
  });

  it('should get a set color blue if there is assignments but nothing urgent', async () => {
    fakeResponse = [
      { due_at: getFarDate().toISOString() }
    ];
    const app = buildAppWithFakeResponse();
    return app.run().then(signal => {
      assert.ok(signal);
      assert.equal(signal.points[0][0].color, '#0000FF');
      assert.equal(daskeyboardApplet.Effects.SET_COLOR, signal.points[0][0].effect);
    }).catch(err => {
      assert.fail(err);
    });
  });

  it('should get no signal if no assignments', async () => {
    fakeResponse = [];
    const app = buildAppWithFakeResponse();
    return app.run().then(signal => {
      assert.equal(signal, null);
    }).catch(err => {
      assert.fail(err);
    });
  });
});