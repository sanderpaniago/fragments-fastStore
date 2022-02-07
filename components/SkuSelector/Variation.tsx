import React from 'react'

import { SkuSelectColors } from '../SkuSelectColors'
import { SkuSelectSize } from '../SkuSelectSize'
import type { DisplayVariation } from './types'
// import { isColor } from './utils'

type Props = {
  variation: DisplayVariation
  selectedItem: string | null
}

export default function Variation({ variation, selectedItem }: Props) {
  const { name, options } = variation
  // const displayImage = isColor(originalName)

  // console.log(selectedItem, variation)

  return (
    <>
      {name === 'Cor' && (
        <SkuSelectColors
          name={name}
          selectedItem={selectedItem}
          variations={options}
        />
      )}
      {name === 'Tamanho' && (
        <SkuSelectSize
          selectedItem={selectedItem}
          name={name}
          variations={options}
        />
      )}
    </>
  )
}
