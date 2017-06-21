using System;
using System.Collections.Generic;
using System.Data;
using System.Linq.Expressions;
using ServiceStack.OrmLite;

namespace ChitFund.Repositories
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected IDbConnection db;

        public Repository(IDbConnection db)
        {
            this.db = db;
        }

        public virtual List<T> GetAll()
        {
            return db.Select<T>();
        }

        public List<T> Get(Expression<Func<T, bool>> exp)
        {
            return db.Select<T>(exp);
        }

        public virtual T GetById(int id)
        {
            var o = db.SingleById<T>(id);
            return o;
        }

        public virtual T GetById(string id)
        {
            var o = db.SingleById<T>(id);
            return o;
        }

        public bool Save(T o)
        {
            
            return db.Save<T>(o); 
        }

        public void Delete(int id)
        {
            db.DeleteById<T>(id);
        }

        public void Delete(Expression<Func<T, bool>> exp)
        {
            db.Delete<T>(exp);
        }
    }
}