import SoQL from './soql';

class SoQLBoolean extends SoQL {

  //guhhhhhhhhhh
  get dataTypeName() {
    return 'checkbox';
  }

  static ctype() {
    return 'boolean';
  }

}

export default SoQLBoolean;
