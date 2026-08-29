<script setup lang="ts">
import { runCommandLine } from '~/utils/commands'
import type {
  TerminalCommandResult,
  TerminalDocument,
  TerminalLine,
} from '~/utils/commands/types'
import type { TerminalDirectory } from '~/utils/terminal'
import {
  completeInput,
  historyAt,
  promptPath,
  resolveDirectory,
  staticRouteHref,
} from '~/utils/terminal'
import { createVirtualFiles } from '~/utils/virtual-files'

type Output = {
  id: number
  cwd: TerminalDirectory
  command?: string
  result: TerminalCommandResult
  direct?: boolean
}

const props = withDefaults(defineProps<{
  posts: TerminalDocument[]
  about: TerminalDocument
  documents: TerminalDocument[]
  initialDirectory?: TerminalDirectory
  initialScreen?: 'recent' | 'post' | 'page'
  initialDocument?: TerminalDocument
}>(), {
  initialDirectory: '~',
  initialScreen: 'recent',
})

const site = useAppConfig().site
const input = ref('')
const inputElement = ref<HTMLInputElement>()
const currentDirectory = ref<TerminalDirectory>(props.initialDirectory)
const history = ref<string[]>([])
const historyIndex = ref(0)
const virtualFiles = computed(() => createVirtualFiles(props.documents))
let outputId = 0

function emptyResult(overrides: Partial<TerminalCommandResult> = {}): TerminalCommandResult {
  return { stdout: [], stderr: [], exitCode: 0, ...overrides }
}

function initialOutputs(): Output[] {
  if (props.initialScreen === 'post' && props.initialDocument) {
    return [{
      id: ++outputId,
      cwd: props.initialDirectory,
      result: emptyResult({ view: { kind: 'post', document: props.initialDocument } }),
      direct: true,
    }]
  }
  if (props.initialScreen === 'page' && props.initialDocument) {
    return [{
      id: ++outputId,
      cwd: props.initialDirectory,
      result: emptyResult({ view: { kind: 'page', document: props.initialDocument } }),
      direct: true,
    }]
  }

  const welcome = [
    `Welcome to ${site.name}.`,
    site.welcome,
    '输入 help 查看可用命令，或直接打开下面的最近文章。',
  ]
  const recent = props.posts.slice(0, 5).map(post => {
    const entry = `${post.path.split('/').pop()}.md`
    return { text: entry, entry }
  })
  return [
    {
      id: ++outputId,
      cwd: '~',
      result: emptyResult({ stdout: welcome.map(text => ({ text })) }),
    },
    {
      id: ++outputId,
      cwd: '~/posts',
      result: emptyResult({ stdout: recent }),
    },
  ]
}

const outputs = ref<Output[]>(initialOutputs())

function addOutput(output: Omit<Output, 'id'>) {
  outputs.value.push({ ...output, id: ++outputId })
}

function fileForEntry(output: Output, entry?: string) {
  if (!entry || entry.endsWith('/')) return undefined
  const path = output.cwd === '~' ? `~/${entry}` : `${output.cwd}/${entry}`
  return virtualFiles.value.find(file => file.path === path)
}

function postForEntry(output: Output, entry?: string) {
  const file = fileForEntry(output, entry)
  return file?.document.path.startsWith('/posts/') ? file.document : undefined
}

function isEntryOutput(result: TerminalCommandResult) {
  return result.stdout.length > 0 && result.stdout.every(line => line.entry)
}

function entryDestination(output: Output, line: TerminalLine) {
  const entry = line.entry
  if (!entry) return undefined
  const file = fileForEntry(output, entry)
  return file ? staticRouteHref(file.document.path) : undefined
}

function promptFor(directory: TerminalDirectory) {
  return `${site.prompt}:${promptPath(directory)}$`
}

async function execute() {
  const raw = input.value.trim()
  if (!raw) return

  const commandDirectory = currentDirectory.value
  history.value.push(raw)
  historyIndex.value = history.value.length
  input.value = ''

  const result = runCommandLine(raw, {
    directory: commandDirectory,
    files: virtualFiles.value,
  })

  if (result.clear) {
    outputs.value = []
  } else if (result.navigation) {
    window.location.assign(result.navigation)
    return
  } else {
    addOutput({ cwd: commandDirectory, command: raw, result })
    if (result.nextDirectory) currentDirectory.value = result.nextDirectory
  }

  await nextTick()
  inputElement.value?.focus()
  if (result.view) {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' })
  }
}

function navigateHistory(direction: -1 | 1) {
  const next = historyAt(history.value, historyIndex.value, direction)
  historyIndex.value = next.index
  input.value = next.value
  nextTick(() => inputElement.value?.setSelectionRange(input.value.length, input.value.length))
}

function complete() {
  const result = completeInput(input.value, currentDirectory.value, virtualFiles.value.map(file => file.path))
  input.value = result.value
  nextTick(() => inputElement.value?.setSelectionRange(input.value.length, input.value.length))
}

async function enterDirectory(entry: string) {
  const target = entry.replace(/\/$/, '')
  const before = currentDirectory.value
  const nextDirectory = resolveDirectory(before, target, virtualFiles.value.map(file => file.path))
  if (!nextDirectory) return
  addOutput({ cwd: before, command: `cd ${target}`, result: emptyResult() })
  currentDirectory.value = nextDirectory
  await nextTick()
  inputElement.value?.focus()
}

function focusFromBackground(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('a, button, input, pre, code')) return
  inputElement.value?.focus()
}

onMounted(() => {
  if (window.matchMedia('(pointer: fine)').matches) inputElement.value?.focus({ preventScroll: true })
})
</script>

<template>
  <section class="console" aria-label="Terminal" @click="focusFromBackground">
    <div class="console__screen" aria-live="polite">
      <div v-for="output in outputs" :key="output.id" class="console-output">
        <p v-if="output.command" class="command-echo"><span>{{ promptFor(output.cwd) }}</span> {{ output.command }}</p>

        <div v-if="output.result.stderr.length" class="text-output text-output--error">
          <p v-for="(line, index) in output.result.stderr" :key="index">{{ line }}</p>
        </div>

        <div
          v-if="isEntryOutput(output.result)"
          class="directory-list"
          :class="{ 'directory-list--horizontal': output.result.layout === 'horizontal' }"
        >
          <div v-for="(line, index) in output.result.stdout" :key="`${line.text}:${index}`" class="directory-entry">
            <button
              v-if="line.entry?.endsWith('/')"
              type="button"
              class="directory directory-button"
              :aria-label="`cd ${line.entry}`"
              @click="enterDirectory(line.entry)"
            >{{ line.text }}</button>
            <a v-else-if="entryDestination(output, line)" :href="entryDestination(output, line)!" class="directory-file">
              {{ line.text }}
            </a>
            <span v-else>{{ line.text }}</span>
            <template v-if="output.result.layout !== 'horizontal' && postForEntry(output, line.entry)">
              <time :datetime="postForEntry(output, line.entry)?.date">{{ postForEntry(output, line.entry)?.date }}</time>
              <a :href="entryDestination(output, line)!" class="directory-title">
                {{ postForEntry(output, line.entry)?.title }}
              </a>
            </template>
          </div>
        </div>

        <div v-else-if="output.result.stdout.length && !output.result.view" class="text-output">
          <p v-for="(line, index) in output.result.stdout" :key="index">{{ line.text }}</p>
        </div>

        <article v-if="output.result.view?.kind === 'post'" class="article">
          <nav v-if="output.direct" class="article__nav" aria-label="文章导航">
            <a href="/">← 返回首页</a>
          </nav>
          <header class="article__header">
            <p class="article__eyebrow">{{ output.result.view.document.date }}</p>
            <h1>{{ output.result.view.document.title }}</h1>
            <p>{{ output.result.view.document.description }}</p>
            <ul v-if="output.result.view.document.tags?.length" class="tag-list" aria-label="文章标签">
              <li v-for="tag in output.result.view.document.tags" :key="tag">#{{ tag }}</li>
            </ul>
          </header>
          <ContentRenderer :value="output.result.view.document" />
          <footer class="article__footer">
            <a v-if="output.direct" href="/">← 返回首页</a>
            <a v-else :href="staticRouteHref(output.result.view.document.path)">打开独立页面 →</a>
          </footer>
        </article>

        <article v-else-if="output.result.view?.kind === 'about' || output.result.view?.kind === 'page'" class="article">
          <nav v-if="output.direct" class="article__nav" aria-label="页面导航">
            <a href="/">← 返回首页</a>
          </nav>
          <header class="article__header">
            <h1>{{ output.result.view.document.title }}</h1>
            <p>{{ output.result.view.document.description }}</p>
          </header>
          <ContentRenderer :value="output.result.view.document" />
          <footer class="article__footer">
            <a v-if="output.direct" href="/">← 返回首页</a>
            <a v-else :href="staticRouteHref(output.result.view.document.path)">打开独立页面 →</a>
          </footer>
        </article>
      </div>
    </div>

    <form class="prompt-form" aria-label="command line" @submit.prevent="execute">
      <label class="prompt-form__label" for="terminal-input">{{ promptFor(currentDirectory) }}</label>
      <input
        id="terminal-input"
        ref="inputElement"
        v-model="input"
        class="prompt-form__input"
        name="command"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="command"
        @keydown.enter.prevent.stop="execute"
        @keydown.up.prevent.stop="navigateHistory(-1)"
        @keydown.down.prevent.stop="navigateHistory(1)"
        @keydown.tab.prevent.stop="complete"
      >
    </form>
  </section>
</template>
