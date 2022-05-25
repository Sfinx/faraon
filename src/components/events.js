const eventsName = [
    'AfterExport',
    'AfterPlot',
    'Animated',
    'AnimatingFrame',
    'AnimationInterrupted',
    'AutoSize',
    'BeforeExport',
    'ButtonClicked',
    // 'Click',
    'SunBurstClick',
    'ClickAnnotation',
    'ContextMenu',
    'Deselect',
    'DoubleClick',
    'Framework',
    'Hover',
    'LegendClick',
    'LegendDoubleClick',
    'Relayout',
    'Restyle',
    'Redraw',
    'Selected',
    'Selecting',
    'SliderChange',
    'SliderEnd',
    'SliderStart',
    'Transitioning',
    'TransitionInterrupted',
    'Unhover'
  ]

  const events = eventsName
    .map(evt => evt.toLocaleLowerCase())
    .map(eventName => ({
      completeName: 'plotly_' + eventName,
      handler: context => (...args) => {
        // console.log('****** event:', eventName)
        if (eventName == 'sunburstclick' && context.options.onClick)
          return context.options.onClick(args[0])
        else
          context.$emit.apply(context, [eventName, ...args])
      }
    }))

  export default events
