import React, { useCallback, memo, useState, useMemo } from 'react'
import { filter, clone } from 'ramda'

import {
  findItemWithSelectedVariations,
  findListItemsWithSelectedVariations,
} from './utils'
import type {
  SelectorProductItem,
  CallbackItem,
  SelectedVariations,
  ImageMap,
  DisplayOption,
  DisplayVariation,
  Variations,
  DisplayMode,
} from './types'
import useEffectSkipMount from './hooks/useEffectSkipMount'
import { getDefaultSeller } from './utils/sellers'
import Variation from './Variation'

export type ShowValueForVariation = 'none' | 'image' | 'all'

// The boolean type was kept because for backward compatibility
export type ShowVariationsLabels =
  | boolean
  | 'none'
  | 'variation'
  | 'itemValue'
  | 'variationAndItemValue'

interface Props {
  seeMoreLabel: string
  maxItems: number
  variations: Variations
  skuItems: SelectorProductItem[]
  onSelectItem: (callbackItem: CallbackItem) => void
  imagesMap: ImageMap
  selectedVariations: Record<string, string | null>
  hideImpossibleCombinations: boolean
  disableUnavailableSelectOptions: boolean
  showValueForVariation: ShowValueForVariation
  showBorders?: boolean
  imageHeight?: number
  imageWidth?: number
  showVariationsLabels: ShowVariationsLabels
  variationsSpacing?: number
  showVariationsErrorMessage: boolean
  displayMode: DisplayMode
  sliderDisplayThreshold: number
  sliderArrowSize: number
}

function isSkuAvailable(item?: SelectorProductItem) {
  if (!item) {
    return false
  }

  const seller = getDefaultSeller(item.sellers)

  if (!seller) {
    return false
  }

  return seller.commertialOffer?.AvailableQuantity > 0
}

const showItemAsAvailable = ({
  possibleItems,
  selectedVariations,
  variationCount,
  isSelected,
}: {
  possibleItems: SelectorProductItem[]
  selectedVariations: SelectedVariations
  variationCount: number
  isSelected: boolean
}) => {
  const selectedNotNull = filter(Boolean, selectedVariations)
  const selectedCount = Object.keys(selectedNotNull).length

  if (selectedCount === variationCount && isSelected) {
    const item = findItemWithSelectedVariations(
      possibleItems,
      selectedVariations
    )

    return isSkuAvailable(item)
  }

  return possibleItems.some(isSkuAvailable)
}

interface AvailableVariationParams {
  variations: Variations
  selectedVariations: SelectedVariations
  imagesMap: ImageMap
  onSelectItemMemo: (callbackItem: CallbackItem) => () => void
  skuItems: SelectorProductItem[]
  hideImpossibleCombinations: boolean
  disableUnavailableSelectOptions: boolean
}

const parseOptionNameToDisplayOption =
  ({
    selectedVariations,
    variationName,
    skuItems,
    onSelectItemMemo,
    imagesMap,
    variationCount,
    hideImpossibleCombinations,
    disableUnavailableSelectOptions,
  }: {
    selectedVariations: SelectedVariations
    variationName: string
    skuItems: SelectorProductItem[]
    onSelectItemMemo: (callbackItem: CallbackItem) => () => void
    imagesMap: ImageMap
    variationCount: number
    hideImpossibleCombinations: boolean
    disableUnavailableSelectOptions: boolean
  }) =>
  (variationValue: {
    name: string
    originalName: string
  }): DisplayOption | null => {
    const isSelected = selectedVariations[variationName] === variationValue.name
    const image = imagesMap?.[variationName]?.[variationValue.name]

    const newSelectedVariation = clone(selectedVariations)

    newSelectedVariation[variationName] = isSelected
      ? null
      : variationValue.name

    const possibleItems = findListItemsWithSelectedVariations(
      skuItems,
      newSelectedVariation
    )

    if (possibleItems.length > 0) {
      // This is a valid combination option
      const [item] = possibleItems
      const callbackFn = onSelectItemMemo({
        name: variationName,
        value: variationValue.name,
        skuId: item.itemId,
        isMainAndImpossible: false,
        possibleItems,
      })

      return {
        label: variationValue.name,
        originalName: variationValue.originalName,
        onSelectItem: callbackFn,
        image,
        available: showItemAsAvailable({
          possibleItems,
          selectedVariations,
          variationCount,
          isSelected,
        }),
        impossible: false,
        disabled: disableUnavailableSelectOptions,
      }
    }

    if (!hideImpossibleCombinations) {
      // This is a impossible combination and will only appear if the prop allows.
      return {
        label: variationValue.name,
        originalName: variationValue.originalName,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onSelectItem: () => {},
        image,
        available: true,
        impossible: true,
        disabled: disableUnavailableSelectOptions,
      }
    }

    // This is a impossible combination and will be hidden.
    return null
  }

const variationNameToDisplayVariation =
  ({
    variations,
    selectedVariations,
    skuItems,
    onSelectItemMemo,
    imagesMap,
    variationCount,
    hideImpossibleCombinations,
    disableUnavailableSelectOptions,
  }: {
    variations: Variations
    selectedVariations: SelectedVariations
    skuItems: SelectorProductItem[]
    imagesMap: ImageMap
    onSelectItemMemo: (callbackItem: CallbackItem) => () => void
    variationCount: number
    hideImpossibleCombinations: boolean
    disableUnavailableSelectOptions: boolean
  }) =>
  (variationName: string): DisplayVariation => {
    const name = variationName
    const { values, originalName } = variations[variationName]
    const options = values
      .map(
        parseOptionNameToDisplayOption({
          selectedVariations,
          variationName,
          skuItems,
          onSelectItemMemo,
          imagesMap,
          variationCount,
          hideImpossibleCombinations,
          disableUnavailableSelectOptions,
        })
      )
      .filter(Boolean) as DisplayOption[]

    return { name, originalName, options }
  }

// Parameters are explained on PropTypes
const getAvailableVariations = ({
  variations,
  selectedVariations,
  imagesMap,
  onSelectItemMemo,
  skuItems,
  hideImpossibleCombinations,
  disableUnavailableSelectOptions,
}: AvailableVariationParams): DisplayVariation[] => {
  const variationCount = Object.keys(variations).length

  return Object.keys(variations).map(
    variationNameToDisplayVariation({
      variations,
      selectedVariations,
      skuItems,
      onSelectItemMemo,
      imagesMap,
      variationCount,
      hideImpossibleCombinations,
      disableUnavailableSelectOptions,
    })
  )
}

const getAvailableVariationsPromise = (
  params: AvailableVariationParams
): Promise<DisplayVariation[]> => {
  return new Promise((resolve) => {
    const result = getAvailableVariations(params)

    resolve(result)
  })
}

export const CSS_HANDLES = ['skuSelectorContainer'] as const

/** Renders the main and the secondary variation, if it exists. */
function SKUSelector({
  variations,
  skuItems,
  onSelectItem,
  imagesMap,
  selectedVariations,
  hideImpossibleCombinations,
  disableUnavailableSelectOptions,
}: Props) {
  const onSelectItemMemo = useCallback(
    ({
        name,
        value,
        skuId,
        isMainAndImpossible,
        possibleItems,
      }: CallbackItem) =>
      () =>
        onSelectItem({
          name,
          value,
          skuId,
          isMainAndImpossible,
          possibleItems,
        }),
    [onSelectItem]
  )

  const availableVariationsPayload = useMemo(
    () => ({
      variations,
      selectedVariations,
      imagesMap,
      onSelectItemMemo,
      skuItems,
      hideImpossibleCombinations,
      disableUnavailableSelectOptions,
    }),
    [
      variations,
      selectedVariations,
      imagesMap,
      onSelectItemMemo,
      skuItems,
      hideImpossibleCombinations,
      disableUnavailableSelectOptions,
    ]
  )

  const [displayVariations, setDisplayVariations] = useState<
    DisplayVariation[]
  >(() => getAvailableVariations(availableVariationsPayload))

  useEffectSkipMount(() => {
    let isCurrent = true
    const promise = getAvailableVariationsPromise(availableVariationsPayload)

    promise.then((availableVariations) => {
      if (isCurrent) {
        setDisplayVariations(availableVariations)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [availableVariationsPayload])

  return (
    <div>
      {displayVariations.reverse().map((variationOption, index) => {
        const selectedItem = selectedVariations[variationOption.name]

        return (
          <Variation
            key={`${variationOption.name}-${index}`}
            variation={variationOption}
            selectedItem={selectedItem}
          />
        )
      })}
    </div>
  )
}

export default memo(SKUSelector)