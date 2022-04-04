import {
  AdvancedTradeFromCheckbox,
  CheckBox,
} from 'components/trade_form/AdvancedTradeForm/CheckBox'
import { useTranslation } from 'next-i18next'
import React from 'react'
import useMangoStore from 'stores/useMangoStore'
import { Options } from 'components/trade_form/AdvancedTradeForm'

interface Props {
  options: Options
  setOptions: (options: Options) => void
  isLimitOrder: boolean
  isTriggerOrder: boolean
  positionSizePercent: string
  handleSetPositionSize: (x: string, y: boolean, z: boolean) => void
}

export const CheckBoxes: React.FC<Props> = ({
  options,
  setOptions,
  isLimitOrder,
  isTriggerOrder,
  positionSizePercent,
  handleSetPositionSize,
}) => {
  const { t } = useTranslation('common')
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const { tradeType } = useMangoStore((s) => s.tradeForm)

  const iocOnChange = (checked) => {
    let _options = options
    if (checked) {
      _options = {
        ...options,
        postOnly: false,
        postOnlySlide: false,
      }
    }
    setOptions({
      ..._options,
      ioc: checked,
    })
  }

  const postOnChange = (checked) => {
    let _options = options
    if (checked) {
      _options = {
        ...options,
        ioc: false,
        postOnlySlide: false,
      }
    }
    setOptions({
      ..._options,
      postOnly: checked,
    })
  }

  const postOnlySlideOnChange = (checked) => {
    let _options = options
    if (checked) {
      _options = {
        ...options,
        ioc: false,
        postOnly: false,
      }
    }
    setOptions({
      ..._options,
      postOnlySlide: checked,
    })
  }

  const reduceOnChange = (checked) => {
    if (positionSizePercent) {
      handleSetPositionSize(positionSizePercent, options.spotMargin, checked)
    }
    setOptions({
      ...options,
      reduceOnly: checked,
    })
  }

  const marginOnChange = (checked) => {
    setOptions({
      ...options,
      spotMargin: checked,
    })
    if (positionSizePercent) {
      handleSetPositionSize(positionSizePercent, checked, options.reduceOnly)
    }
  }

  const checkBoxes: AdvancedTradeFromCheckbox[] = [
    {
      tooltipContent: t('tooltip-post'),
      checked: options.postOnly,
      onChange: (e) => postOnChange(e.target.checked),
      text: 'POST',
      show: isLimitOrder,
      disabled: false,
    },
    {
      tooltipContent: t('tooltip-ioc'),
      checked: options.ioc,
      onChange: (e) => iocOnChange(e.target.checked),
      text: 'IOC',
      show: isLimitOrder,
      disabled: false,
    },
    {
      tooltipContent: t('tooltip-reduce'),
      checked: options.reduceOnly,
      onChange: (e) => reduceOnChange(e.target.checked),
      text: 'Reduce Only',
      show: marketConfig.kind === 'perp',
      disabled: isTriggerOrder,
    },
    {
      tooltipContent: t('tooltip-post-and-slide'),
      checked: options.postOnlySlide,
      onChange: (e) => postOnlySlideOnChange(e.target.checked),
      text: 'Slide',
      show: marketConfig.kind === 'perp' && tradeType === 'Limit',
      disabled: isTriggerOrder,
    },
    {
      tooltipContent: t('tooltip-enable-margin'),
      checked: options.spotMargin,
      onChange: (e) => marginOnChange(e.target.checked),
      text: t('margin'),
      show: marketConfig.kind === 'spot',
      disabled: false,
    },
  ]

  return (
    <>
      {checkBoxes.map((c, index) => {
        return (
          <CheckBox
            key={index}
            tooltipContent={c.tooltipContent}
            checked={c.checked}
            onChange={c.onChange}
            text={c.text}
            show={c.show}
            disabled={c.disabled}
          />
        )
      })}
    </>
  )
}
