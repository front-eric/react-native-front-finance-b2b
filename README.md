## Installing

### Package manager

Using npm:

```bash
$ npm install react-native-front-finance-b2b
```

Using yarn:

```bash
$ yarn add react-native-front-finance-b2b
```

Once the package is installed, you can import the library using `import` or `require` approach:

```js
import {FrontFinance} from 'react-native-front-finance-b2b';
```

## Usage

```js
import {FrontFinance} from 'react-native-front-finance-b2b';

export const App = () => {
    return(
        <>
        <FrontFinance
        client_id={your_client_id}
        client_secret={your_client_secret}
        userId={your_unique_userId}
        />
        </>
    )
}
```
## License

[MIT](LICENSE)
