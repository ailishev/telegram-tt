import TeactDOM from './lib/teact/teact-dom';

import { requestMutation } from './lib/fasterdom/fasterdom';

import DemoMessengerApp from './components/DemoMessengerApp';

import './assets/fonts/roboto.css';
import './styles/index.scss';

requestMutation(() => {
  TeactDOM.render(
    <DemoMessengerApp />,
    document.getElementById('root')!,
  );
});
