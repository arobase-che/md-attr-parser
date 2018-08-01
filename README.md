md-attr-parser
===========

A node plugin to parse attributes (custom HTML attributes).


## Syntax

The syntax is common :

```markdown
{#thisIsAnId .thisIsAClass thisKey=thisValue}

{thatKey="value" thisKey='thatValue'}
```

## Usage

```js
const parseAttr = require('md-attr-parser');


parseAttr('{ width=500px editable=true }');

parseAttr('height=500px');
```

The output is an object of the form :
```js
{
  prop: {               // Keep the key-value attribute
    class: undefined,   // A list of class
    id: undefined,      // The uniq id
  },
  eaten: '',            // Every characters parsed
}
```

For example this code will output :
```js
parseAttr('{ width=500px editable=true #unicorn .dangerous .cute }');
```

```js
{
  prop: {
    class: ['dangerous', 'cute'],
    id: 'unicorn',
    width: '500px',
    editable: 'true',
  },
  eaten: '{ width=500px editable=true #unicorn .dangerous .cute }',
}
```


## Licence

MIT
