#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const MENU_OLD =
  '    if (nav.achievementList.length) options.push(\n' +
  '      { name: "Посмотреть достижения.", group: "choice", achievements: true }\n' +
  '    );';

const MENU_NEW =
  '    if (nav.achievementList.length) options.push(\n' +
  '      { name: "Посмотреть достижения.", group: "choice", achievements: true },\n' +
  '      { name: "Открыть все достижения.", group: "choice", unlockAllAchievements: true }\n' +
  '    );';

const DISPATCH_OLD =
  '      } else if (option.achievements) {\n' +
  '        return showAchievements();\n';

const DISPATCH_NEW =
  '      } else if (option.achievements) {\n' +
  '        return showAchievements();\n' +
  '      } else if (option.unlockAllAchievements) {\n' +
  '        return unlockAllAchievements();\n';

const FUNC_ANCHOR = "function achieve(name, title, description) {";

const FUNC_NEW =
  'function unlockAllAchievements() {\n' +
  '  asyncConfirm("Открыть все достижения? Это действие нельзя отменить.", function(result) {\n' +
  '    if (!result) return;\n' +
  '    for (var i = 0; i < nav.achievementList.length; i++) {\n' +
  '      nav.achieved[nav.achievementList[i]] = true;\n' +
  '    }\n' +
  '    checkAchievements(function() {\n' +
  '      if (initStore()) window.store.set("achieved", toJson(nav.achieved));\n' +
  '      showAchievements();\n' +
  '    });\n' +
  '  });\n' +
  '}\n\n' +
  FUNC_ANCHOR;

function fail(message) {
  console.error("Ошибка: " + message);
  process.exit(1);
}

function resolveUiPath(input) {
  if (!input) input = path.join(__dirname, "..", "deploy");
  const stat = fs.statSync(input, { throwIfNoEntry: false });
  if (!stat) fail("путь не найден: " + input);
  if (stat.isDirectory()) return path.join(input, "ui.js");
  return input;
}

const target = resolveUiPath(process.argv[2]);
if (!fs.existsSync(target)) fail("файл не найден: " + target);

let source = fs.readFileSync(target, "utf8");
if (source.includes("function unlockAllAchievements()")) {
  console.log("Мод уже установлен: " + target);
  process.exit(0);
}
if (source.includes("\r\n")) {
  fail("ui.js использует переводы строк CRLF. Откройте файл в редакторе, сохраните с LF и повторите.");
}
if (!source.includes(MENU_OLD)) fail("не найден блок меню достижений в " + target + " (нужна русская ui.js из перевода)");
if (!source.includes(DISPATCH_OLD)) fail("не найдена обработка пункта достижений в " + target);
if (!source.includes(FUNC_ANCHOR)) fail("не найдена функция achieve в " + target);

const backup = target + ".bak";
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);

source = source.replace(MENU_OLD, MENU_NEW);
source = source.replace(DISPATCH_OLD, DISPATCH_NEW);
source = source.replace(FUNC_ANCHOR, FUNC_NEW);
fs.writeFileSync(target, source);

console.log("Мод установлен: " + target);
console.log("Резервная копия: " + backup);
console.log("Откройте игру: Меню → «Открыть все достижения.»");
