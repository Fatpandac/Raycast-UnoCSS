import * as st from 'prettier/standalone'
import * as pp from 'prettier/parser-postcss'
import { docs } from '.'
import { RuleItem } from './types'


export function getDocs(item: RuleItem) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return item.features?.map(i => docs.value.find(s => s.title === i)!) || []
}

export function sampleArray<T>(arr: T[], count: number) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Array.from({ length: count }, _ => arr[Math.round(Math.random() * (arr.length - 1))])
}

export function extractColors(css: string) {
  return Array.from(css.matchAll(/\brgba?\((.+?)\)/g))
    .map((i) => {
      const [r, g, b, a] = i[1].split(',').map(i => parseInt(i.trim()))
      if (Number.isNaN(r))
        return ''
      if (!Number.isNaN(a))
        return `rgba(${r}, ${g}, ${b}, ${a})`
      return `rgb(${r}, ${g}, ${b})`
    })
    .filter(Boolean)
}

const prettier: typeof import('prettier/standalone')['format'] = st.format
const prettierParserCSS: typeof import('prettier/parser-postcss') = pp

export async function formatCSS(input: string) {
  return prettier(
    input,
    {
      parser: 'css',
      plugins: [prettierParserCSS],
      printWidth: Infinity,
    },
  )
}
