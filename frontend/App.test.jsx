import { render, screen } from '@testing-library/react';
import App from './App';
test('renders AlgoJudge', () => {
  render(<App />);
  expect(screen.getByText(/AlgoJudge/i)).toBeInTheDocument();
});
