import { Plus, Minus, Edit3 } from 'lucide-react';

interface DiffProps {
  oldVersion: any;
  newVersion: any;
}

interface Change {
  type: 'added' | 'removed' | 'modified';
  field: string;
  oldValue?: any;
  newValue?: any;
}

function detectChanges(oldData: any, newData: any): Change[] {
  const changes: Change[] = [];

  const compareFields = ['title', 'description', 'prep_time', 'cooking_time', 'yield_amount', 'skill_level', 'notes'];

  compareFields.forEach((field) => {
    if (oldData[field] !== newData[field]) {
      changes.push({
        type: 'modified',
        field,
        oldValue: oldData[field],
        newValue: newData[field],
      });
    }
  });

  const oldIngs = oldData.ingredients || [];
  const newIngs = newData.ingredients || [];

  newIngs.forEach((ing: any, idx: number) => {
    if (!oldIngs[idx] || JSON.stringify(ing) !== JSON.stringify(oldIngs[idx])) {
      if (!oldIngs[idx]) {
        changes.push({ type: 'added', field: 'ingredient', newValue: ing });
      } else {
        changes.push({ type: 'modified', field: 'ingredient', oldValue: oldIngs[idx], newValue: ing });
      }
    }
  });

  if (oldIngs.length > newIngs.length) {
    oldIngs.slice(newIngs.length).forEach((ing: any) => {
      changes.push({ type: 'removed', field: 'ingredient', oldValue: ing });
    });
  }

  return changes;
}

export function RecipeDiff({ oldVersion, newVersion }: DiffProps) {
  const changes = detectChanges(oldVersion.recipe_data, newVersion.recipe_data);

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus size={16} className="text-green-600" />;
      case 'removed': return <Minus size={16} className="text-red-600" />;
      case 'modified': return <Edit3 size={16} className="text-yellow-600" />;
      default: return null;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added': return 'bg-green-50 border-green-200';
      case 'removed': return 'bg-red-50 border-red-200';
      case 'modified': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
      if (value.item) return `${value.quantity} ${value.item}`;
      if (value.instruction) return value.instruction;
      return JSON.stringify(value);
    }
    return String(value || '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600">
            Version {oldVersion.version_number} → Version {newVersion.version_number}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(oldVersion.created_at).toLocaleDateString()} →{' '}
            {new Date(newVersion.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
            +{changes.filter((c) => c.type === 'added').length}
          </span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
            -{changes.filter((c) => c.type === 'removed').length}
          </span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
            ~{changes.filter((c) => c.type === 'modified').length}
          </span>
        </div>
      </div>

      {changes.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No changes detected</p>
      ) : (
        <div className="space-y-2">
          {changes.map((change, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${getChangeColor(change.type)}`}
            >
              <div className="flex items-start gap-2">
                {getChangeIcon(change.type)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 capitalize mb-1">
                    {change.field.replace('_', ' ')}
                  </p>

                  {change.type === 'added' && (
                    <p className="text-sm text-green-700">
                      + {formatValue(change.newValue)}
                    </p>
                  )}

                  {change.type === 'removed' && (
                    <p className="text-sm text-red-700 line-through">
                      - {formatValue(change.oldValue)}
                    </p>
                  )}

                  {change.type === 'modified' && (
                    <div className="space-y-1">
                      <p className="text-sm text-red-700 line-through">
                        - {formatValue(change.oldValue)}
                      </p>
                      <p className="text-sm text-green-700">
                        + {formatValue(change.newValue)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
