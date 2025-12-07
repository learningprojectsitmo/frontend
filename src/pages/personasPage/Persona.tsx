import './PersonasPage.css';

interface Persona {
  firstName: string,
  middleName: string,
  lastName:string
}

export function Persona({ firstName, middleName, lastName }: Persona) {

  return (
    <div className="persona-block">
        <img className="persona-icon" src="../../persona_default_icon.png"/>
        <div className="persona-info">
            <div className="persona-name">{middleName + firstName + lastName}</div>
            <div className="persona-group">
                <div className="persona-group-title">Группа</div>
                <div className="persona-group-content">К3140</div>
            </div>
            <div className="persona-group">
                <div className="persona-group-title">Роль</div>
                <div className="persona-group-content">Бакалавр</div>
            </div>
        </div>
    </div>
  );
}