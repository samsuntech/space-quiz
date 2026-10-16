const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const html = readFileSync(join(__dirname, "../index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function loadQuiz(random = () => 0) {
  let activeElement;
  function element(id) {
    return {
      id, children: [], textContent: "", hidden: false, disabled: false,
      style: {}, attributes: {}, listeners: {}, className: "",
      classList: {
        add() {}
      },
      append(...nodes) { this.children.push(...nodes); },
      replaceChildren(...nodes) { this.children = nodes; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      querySelector(selector) {
        return this.children.find(node => node.className === selector.slice(1));
      },
      focus() { activeElement = this.id; }
    };
  }
  const nodes = Object.fromEntries(
    [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, element(id)])
  );
  const context = vm.createContext({
    document: {
      querySelectorAll: () => Object.values(nodes),
      createElement: () => element()
    },
    Math: Object.assign(Object.create(Math), { random: () => random() })
  });
  vm.runInContext(script, context);
  return {
    nodes,
    run: code => vm.runInContext(code, context),
    click: id => nodes[id].listeners.click(),
    setRandom: value => { random = () => value; },
    active: () => activeElement
  };
}

test("controlled random inputs create complete permutations without changing source data", () => {
  const quiz = loadQuiz();
  assert.equal(quiz.run("roundQuestions === questions"), false);
  assert.deepEqual(
    Array.from(quiz.run("roundQuestions.map(item => questions.indexOf(item))")),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
  );
  const original = quiz.run("JSON.stringify(questions)");
  quiz.run("questions.forEach(item => { Object.freeze(item.answers); Object.freeze(item); }); Object.freeze(questions)");
  quiz.setRandom(0.999999);
  assert.deepEqual(
    Array.from(quiz.run("createRound().map(item => questions.indexOf(item))")),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  );
  for (const value of [0, 0.25, 0.5, 0.75, 0.999999]) {
    quiz.setRandom(value);
    assert.equal(quiz.run("new Set(createRound()).size"), 10);
  }
  assert.equal(quiz.run("JSON.stringify(questions)"), original);
});

test("a round keeps its order and matching question data throughout all ten answers", () => {
  const quiz = loadQuiz();
  const { nodes } = quiz;
  const order = quiz.run("JSON.stringify(roundQuestions)");
  assert.equal(quiz.run("score"), 0);
  assert.equal(nodes.next.disabled, true);
  assert.equal(nodes.feedback.hidden, true);
  assert.equal(quiz.active(), undefined);
  quiz.click("next");
  assert.equal(quiz.run("index"), 0);
  for (let i = 0; i < 10; i++) {
    assert.equal(nodes["question-number"].textContent, String(i + 1).padStart(2, "0"));
    assert.equal(nodes.question.textContent, quiz.run("roundQuestions[index].question"));
    assert.equal(nodes.topic.textContent, quiz.run("roundQuestions[index].topic"));
    assert.deepEqual(
      nodes.answers.children.map(button => button.querySelector(".answer-label").textContent),
      Array.from(quiz.run("roundQuestions[index].answers"))
    );
    const progress = nodes.progress.attributes["aria-valuenow"];
    const chosen = quiz.run("roundQuestions[index].correct");
    nodes.answers.children[chosen].listeners.click();
    assert.equal(nodes.score.textContent, i + 1);
    assert.equal(nodes.progress.attributes["aria-valuenow"], String(i + 1));
    assert.notEqual(nodes.progress.attributes["aria-valuenow"], progress);
    assert.equal(nodes.feedback.children[1].textContent, quiz.run("roundQuestions[index].fact"));
    assert.ok(nodes.answers.children.every(button => button.disabled));
    quiz.run("selectAnswer(roundQuestions[index].correct)");
    assert.equal(nodes.score.textContent, i + 1);
    assert.equal(quiz.run("JSON.stringify(roundQuestions)"), order);
    quiz.click("next");
    if (i < 9) {
      assert.equal(quiz.active(), "question");
      assert.equal(nodes.progress.attributes["aria-valuenow"], String(i + 1));
      assert.equal(nodes.next.disabled, true);
    }
  }
  assert.equal(nodes["final-score"].textContent, "10 / 10");
  assert.equal(nodes.accuracy.textContent, "100%");
  assert.equal(quiz.active(), "result-title");
});

test("restart generates a fresh round and resets quiz state and focus", () => {
  const quiz = loadQuiz();
  const firstOrder = quiz.run("JSON.stringify(roundQuestions)");
  quiz.run("selectAnswer(roundQuestions[0].correct); showResults()");
  quiz.setRandom(0.999999);
  quiz.click("restart");
  assert.notEqual(quiz.run("JSON.stringify(roundQuestions)"), firstOrder);
  assert.equal(quiz.run("index"), 0);
  assert.equal(quiz.run("score"), 0);
  assert.equal(quiz.run("answered"), false);
  assert.equal(quiz.nodes.score.textContent, "0");
  assert.equal(quiz.nodes.progress.attributes["aria-valuenow"], "0");
  assert.equal(quiz.nodes["progress-fill"].style.width, "0%");
  assert.equal(quiz.nodes.feedback.hidden, true);
  assert.equal(quiz.nodes.feedback.children.length, 0);
  assert.equal(quiz.nodes.next.disabled, true);
  assert.ok(quiz.nodes.answers.children.every(button => !button.disabled));
  assert.equal(quiz.nodes.quiz.hidden, false);
  assert.equal(quiz.nodes.results.hidden, true);
  assert.equal(quiz.active(), "question");
});

test("shuffled rounds retain wrong-answer scoring and result tier boundaries", () => {
  for (const [target, title] of [
    [0, "Keep looking up!"], [3, "Keep looking up!"],
    [4, "A stellar start!"], [6, "A stellar start!"],
    [7, "You're a star explorer!"], [9, "You're a star explorer!"],
    [10, "Out of this world!"]
  ]) {
    const quiz = loadQuiz();
    for (let i = 0; i < 10; i++) {
      quiz.run(`selectAnswer((roundQuestions[index].correct + ${i < target ? 0 : 1}) % 4)`);
      quiz.click("next");
    }
    assert.equal(quiz.nodes["final-score"].textContent, `${target} / 10`);
    assert.equal(quiz.nodes.accuracy.textContent, `${target * 10}%`);
    assert.equal(quiz.nodes["result-title"].textContent, title);
  }
});
