import { AIChatRender, AIChatProvider } from '@ai-nucl/web-react-chat';
import { HttpTransporter } from '@ai-nucl/web-ai';
import { addVChartTool } from '@ai-nucl/web-tool-vchart';
import { addArcoFormTool } from '@ai-nucl/web-tool-arco';
import '@ai-nucl/web-react-chat/style.css';

import './App.scss';

addVChartTool();
addArcoFormTool();

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxOTE1ODIyOTQwNDE2LCJuYW1lIjoibnVjbCIsIm5pY2tOYW1lIjoibnVjbCIsInN0YXR1cyI6ImFjdGl2ZSIsInJvbGVzIjpbMV0sImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImlhdCI6MTc2NTc2NDM4OSwiZXhwIjoxNzY1ODUwNzg5fQ.USWAuZAL7xD0SFa22fOAwm7LhL7QZ6VQLgZ8tCibvW0';

const baseUrl = 'http://localhost:3100';
const httpTransporter = new HttpTransporter({
  simpleChatRequestOptions: {
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
      <AIChatProvider transporter={httpTransporter}>
        <AIChatRender
          quickQuestions={[
            { prompt: '分析用户年龄，并绘制年龄分布图', render: '分析年龄' },
            { prompt: '分析用户性别，并绘制性别分布图', render: '分析性别' },
          ]}
        />
      </AIChatProvider>
    </div>
  );
}

export default App;
