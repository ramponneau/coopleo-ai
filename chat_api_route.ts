import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' && req.query.action === 'chat') {
    const { message, session_id } = req.body;

    const python = spawn('python', ['path/to/api_handler.py']);
    
    python.stdin.write(JSON.stringify({ message, session_id }));
    python.stdin.end();

    let data = '';
    for await (const chunk of python.stdout) {
      data += chunk;
    }

    const output = JSON.parse(data);

    res.status(200).json({ response: output.response });
  } else if (req.method === 'GET' && req.query.action === 'summary') {
    const { session_id } = req.query;

    const python = spawn('python', ['path/to/api_handler.py', 'summary', session_id as string]);

    let data = '';
    for await (const chunk of python.stdout) {
      data += chunk;
    }

    const output = JSON.parse(data);

    res.status(200).json({ summary: output.summary });
  } else if (req.method === 'GET' && req.query.action === 'history') {
    const { session_id } = req.query;

    const python = spawn('python', ['path/to/api_handler.py', 'history', session_id as string]);

    let data = '';
    for await (const chunk of python.stdout) {
      data += chunk;
    }

    const output = JSON.parse(data);

    res.status(200).json({ conversations: output });
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
