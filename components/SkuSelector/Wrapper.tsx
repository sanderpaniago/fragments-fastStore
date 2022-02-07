import React, { useMemo } from 'react'

import type {
  InitialSelectionType,
  ShowValueForVariation,
  ShowVariationsLabels,
  Variations,
} from './types'
import type { ProductItem, SkuSpecification } from './types/product'
import SkuSelectorContainer from './SKUSelectorContainer'

const getVariationsFromItems = (
  skuItems: ProductItem[],
  visibleVariations?: string[]
) => {
  const variations: Variations = {}
  const variationsSet: Record<string, Set<string>> = {}

  for (const skuItem of skuItems) {
    for (const currentVariation of skuItem.variations) {
      const { name, values } = currentVariation

      if (
        !visibleVariations ||
        visibleVariations.includes(name.toLowerCase().trim())
      ) {
        const [value] = values
        const currentSet = variationsSet[name] || new Set()

        currentSet.add(value)
        variationsSet[name] = currentSet
      }
    }
  }

  const variationsNames = Object.keys(variationsSet)

  // Transform set back to array
  for (const variationName of variationsNames) {
    const set = variationsSet[variationName]

    variations[variationName] = {
      originalName: variationName,
      values: Array.from(set).map((value) => ({
        name: value,
        originalName: value,
      })),
    }
  }

  return variations
}

const getVariationsFromSpecifications = (
  skuSpecifications: SkuSpecification[],
  visibleVariations?: string[]
) => {
  const variations: Variations = {}

  for (const specification of skuSpecifications) {
    if (
      !visibleVariations ||
      visibleVariations.includes(
        specification.field.originalName.toLowerCase().trim()
      )
    ) {
      variations[specification.field.name] = {
        originalName: specification.field.originalName,
        values: specification.values.map((value) => ({
          name: value.name,
          originalName: value.originalName,
        })),
      }
    }
  }

  return variations
}

const useVariations = ({
  skuItems,
  skuSpecifications,
  shouldNotShow,
  visibleVariations,
}: {
  skuItems: ProductItem[]
  skuSpecifications: SkuSpecification[]
  shouldNotShow: boolean
  visibleVariations?: string[]
}) => {
  const isSkuSpecificationsEmpty = skuSpecifications.length === 0
  /* if the skuSpecifications array has values, then it should be used to find
   * the variations, which will come ordered the same way they are in the catalog */
  const variationsSource = isSkuSpecificationsEmpty
    ? skuItems
    : skuSpecifications

  const result = useMemo(() => {
    if (
      shouldNotShow ||
      (visibleVariations && visibleVariations.length === 0)
    ) {
      return {}
    }

    let formattedVisibleVariations = visibleVariations

    if (visibleVariations) {
      formattedVisibleVariations = visibleVariations.map((variation) =>
        variation.toLowerCase().trim()
      )
    }

    return isSkuSpecificationsEmpty
      ? getVariationsFromItems(
          variationsSource as ProductItem[],
          formattedVisibleVariations
        )
      : getVariationsFromSpecifications(
          variationsSource as SkuSpecification[],
          formattedVisibleVariations
        )
  }, [
    variationsSource,
    shouldNotShow,
    visibleVariations,
    isSkuSpecificationsEmpty,
  ])

  return result
}

interface Props {
  skuItems: ProductItem[]
  skuSelected: ProductItem | null
  onSKUSelected?: (skuId: string) => void
  maxItems?: number
  visibility?: string
  seeMoreLabel: string
  hideImpossibleCombinations?: boolean
  disableUnavailableSelectOptions?: boolean
  showValueNameForImageVariation?: boolean
  showValueForVariation?: ShowValueForVariation
  thumbnailImage?: string
  visibleVariations?: string[]
  showVariationsLabels: ShowVariationsLabels
  variationsSpacing?: number
  showVariationsErrorMessage?: boolean
  initialSelection?: InitialSelectionType
  sliderDisplayThreshold?: number
  sliderArrowSize?: number
  product: ProductItem
  skuSpecificationsProduct: SkuSpecification[]
}

export default function SkuWrapper(props: Props) {
  const shouldSelectInitialSKU = props.initialSelection !== 'empty'

  const { skuItems, product, skuSpecificationsProduct } = props

  let skuSelected = props.skuSelected ?? null

  if (shouldSelectInitialSKU && skuSelected == null) {
    skuSelected = product
  }

  const visibility = props.visibility != null ? props.visibility : 'always'

  const shouldNotShow =
    (shouldSelectInitialSKU && skuSelected == null) ||
    skuItems.length === 0 ||
    skuSelected?.variations.length === 0 ||
    (visibility === 'more-than-one' && skuItems.length === 1)

  const skuSpecifications = skuSpecificationsProduct ?? []
  const variations = useVariations({
    skuItems,
    skuSpecifications,
    shouldNotShow,
    visibleVariations: props.visibleVariations,
  })

  if (shouldNotShow) {
    return null
  }

  let showValueForVariation: ShowValueForVariation = 'none'

  if (props.showValueForVariation) {
    showValueForVariation = props.showValueForVariation
  } else if (props.showValueNameForImageVariation) {
    showValueForVariation = 'image'
  }

  return (
    <SkuSelectorContainer
      skuItems={skuItems}
      variations={variations}
      skuSelected={skuSelected}
      seeMoreLabel={props.seeMoreLabel}
      onSKUSelected={props.onSKUSelected}
      thumbnailImage={props.thumbnailImage}
      initialSelection={props.initialSelection}
      variationsSpacing={props.variationsSpacing}
      showValueForVariation={showValueForVariation}
      showVariationsLabels={props.showVariationsLabels}
      hideImpossibleCombinations={props.hideImpossibleCombinations}
      disableUnavailableSelectOptions={props.disableUnavailableSelectOptions}
      showVariationsErrorMessage={props.showVariationsErrorMessage}
    />
  )
}
