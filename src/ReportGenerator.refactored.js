const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VALUE = 500;

// --- Políticas de visibilidade por perfil (substitui o if/else de roles) ---
const visibilityPolicies = {
  ADMIN: () => true,
  USER: (item) => item.value <= USER_MAX_VALUE,
};

const isPriority = (user, item) =>
  user.role === 'ADMIN' && item.value > ADMIN_PRIORITY_THRESHOLD;

// --- Formatadores por tipo de relatório (substitui o if/else de tipos) ---
const csvFormatter = {
  header: () => 'ID,NOME,VALOR,USUARIO\n',
  row: (item, user) => `${item.id},${item.name},${item.value},${user.name}\n`,
  footer: (total) => `\nTotal,,\n${total},,\n`,
};

const htmlFormatter = {
  header: (user) =>
    '<html><body>\n' +
    '<h1>Relatório</h1>\n' +
    `<h2>Usuário: ${user.name}</h2>\n` +
    '<table>\n' +
    '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
  row: (item, user, priority) => {
    const style = priority ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  },
  footer: (total) =>
    `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`,
};

const emptyFormatter = {
  header: () => '',
  row: () => '',
  footer: () => '',
};

const formatters = { CSV: csvFormatter, HTML: htmlFormatter };

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = formatters[reportType] ?? emptyFormatter;
    const visibleItems = this.filterVisibleItems(user, items);

    const header = formatter.header(user);
    const body = visibleItems
      .map((item) => formatter.row(item, user, isPriority(user, item)))
      .join('');
    const total = this.calculateTotal(visibleItems);

    return (header + body + formatter.footer(total)).trim();
  }

  filterVisibleItems(user, items) {
    const isVisible = visibilityPolicies[user.role] ?? (() => false);
    return items.filter(isVisible);
  }

  calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
}
