import axios from 'axios'

import { api } from '../../../store.config'

export default async function getDataProduct(id: string) {
  const { data } = await axios.get(
    `https://${api.storeId}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=skuId:${id}`
  )

  if (data.length < 1) {
    return {
      items: [],
      skuSpecifications: [],
      flags: [],
    }
  }

  return {
    items: itemsProduct(data),
    skuSpecifications: skuSpecifications(data),
    flags: flags(data),
    informacoesTecnicas: informacoesTecnicas(data),
    beneficiosDoProduto: beneficiosDoProduto(data),
  }
}

function beneficiosDoProduto(data: any) {
  return data[0]?.beneficiosDoProduto ? data[0]?.beneficiosDoProduto[0] : ''
}

function informacoesTecnicas(data: any) {
  return data[0]?.informacoesTecnicas ? data[0]?.informacoesTecnicas[0] : ''
}

function flags(data: any) {
  const flag: any = {
    rating: '0',
  }

  if (data[0]) {
    if (data[0].Oferta) {
      flag.offer = data[0].Oferta[0]
    }

    if (data[0]['Diferenciais e Tecnologia']) {
      flag.differentialsTechnology = data[0]['Diferenciais e Tecnologia'][0]
    }

    if (data[0]['Avaliações']) {
      flag.rating = data[0]['Avaliações'][0]
    }

    flag.clusterHighlights = Object.keys(data[0].clusterHighlights).map(
      (key) => ({ field: Number(key), value: data[0].clusterHighlights[key] })
    )
  }

  return flag
}

function skuSpecifications(data: any) {
  return (
    data[0].skuSpecifications.map((item: any) => ({
      field: {
        originalName: item.field.name,
        name: item.field.name,
      },
      values: item.values.map((value: any) => ({
        name: value.name,
        originalName: value.name,
      })),
    })) || []
  )
}

function itemsProduct(data: any) {
  if (!data[0].items) {
    return []
  }

  return data[0].items.map((item: any) => {
    let variations = []

    if (item.variations) {
      variations = item.variations.map((variation: any) => ({
        name: variation,
        values: item[variation],
      }))
    }

    const sellers =
      item.sellers.map((seller: any) => ({
        sellerDefault: seller.sellerDefault,
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        commertialOffer: {
          Price: seller.commertialOffer.Price,
          ListPrice: seller.commertialOffer.ListPrice,
          AvailableQuantity: seller.commertialOffer.AvailableQuantity,
          PaymentOptions: seller.commertialOffer.PaymentOptions,
        },
      })) || []

    const installments =
      item.sellers[0].commertialOffer.Installments.map((installment: any) => ({
        value: installment.Value,
        totalValuePlusInterestRate: installment.TotalValuePlusInterestRate,
        numberOfInstallments: installment.NumberOfInstallments,
        name: installment.Name,
      })) || []

    return {
      itemId: item.itemId,
      name: item.name,
      images: item.images,
      variations,
      sellers,
      installments,
      color: item.Cor ? item.Cor[0] : null,
    }
  })
}
