import { AIChatRender } from '@ai-nucl/web-react-chat';
import { HttpTransporter } from '@ai-nucl/web-ai';
import { addVChartTool } from '@ai-nucl/web-tool-vchart';
import { addArcoFormTool } from '@ai-nucl/web-tool-arco';
import '@ai-nucl/web-react-chat/style.css';

import './App.scss';

addVChartTool();
addArcoFormTool();

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo0NTA5MzMyNzY5MjgsIm5hbWUiOiJudWNsIiwibmlja05hbWUiOiJudWNsIiwic3RhdHVzIjoiYWN0aXZlIiwicm9sZXMiOlsxXSwiaXNTdXBlckFkbWluIjp0cnVlfSwiaWF0IjoxNzY0MjI4MzE2LCJleHAiOjE3NjQzMTQ3MTZ9.zM86igOF8IcvomzpgJp8mD98WsmZ-oUKELfr2_T3X78';

const baseUrl = 'http://localhost:3100';
const httpTransporter = new HttpTransporter({
  simpleChartRequestOptions: {
    url: `${baseUrl}/ai/generateText`,
    headers: {
      'Content-Type': 'application/json',
      'nucl-user': token,
    },
  },
  startTaskRequestOptions: {
    url: `${baseUrl}/ai/task`,
    headers: {
      'Content-Type': 'application/json',
      'nucl-user': token,
    },
  },
  reportFunctionCallResultRequestOptions: {
    url: `${baseUrl}/ai/functionCallResult`,
    headers: {
      'Content-Type': 'application/json',
      'nucl-user': token,
    },
  },
});

function App() {
  return (
    <div
      style={{
        height: '100vh',
        maxWidth: '1024px',
        margin: '0 auto',
        paddingBottom: '1rem',
      }}
    >
      <AIChatRender transporter={httpTransporter} />
    </div>
  );
}

export default App;
